import { useState, useEffect } from 'react'
import AceEditor from 'react-ace'
import {
  Play,
  Copy,
  Check,
  Download,
  Trash2,
  Terminal,
  X,
  FileCode,
  ChevronRight,
  FolderOpen,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import 'ace-builds/src-noconflict/mode-javascript'
import 'ace-builds/src-noconflict/mode-typescript'
import 'ace-builds/src-noconflict/mode-python'
import 'ace-builds/src-noconflict/mode-html'
import 'ace-builds/src-noconflict/mode-css'
import 'ace-builds/src-noconflict/mode-json'
import 'ace-builds/src-noconflict/mode-sh'
import 'ace-builds/src-noconflict/theme-one_dark'
import 'ace-builds/src-noconflict/ext-language_tools'

interface FileItem {
  name: string
  language: string
  code: string
}

interface MultiFileIDEProps {
  files: FileItem[]
  entryFile?: string
  onClose: () => void
}

const languageToMode: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  js: 'javascript',
  ts: 'typescript',
  jsx: 'javascript',
  tsx: 'typescript',
  python: 'python',
  py: 'python',
  html: 'html',
  css: 'css',
  json: 'json',
  bash: 'sh',
  shell: 'sh',
  sh: 'sh',
}

const languageColors: Record<string, string> = {
  javascript: '#f7df1e',
  typescript: '#3178c6',
  js: '#f7df1e',
  ts: '#3178c6',
  jsx: '#61dafb',
  tsx: '#3178c6',
  json: '#292929',
  css: '#264de4',
  html: '#e34c26',
  python: '#3776ab',
}

const runnableLanguages = ['javascript', 'typescript', 'js', 'ts', 'jsx', 'tsx']

export const MultiFileIDE = ({ files: initialFiles, entryFile, onClose }: MultiFileIDEProps) => {
  const [files, setFiles] = useState<FileItem[]>(initialFiles)
  const [activeFile, setActiveFile] = useState(entryFile || initialFiles[0]?.name || '')
  const [openTabs, setOpenTabs] = useState<string[]>([entryFile || initialFiles[0]?.name || ''])
  const [output, setOutput] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showOutput, setShowOutput] = useState(false)
  const [showExplorer, setShowExplorer] = useState(true)

  const currentFile = files.find((f) => f.name === activeFile)
  const mode = currentFile ? languageToMode[currentFile.language.toLowerCase()] || 'javascript' : 'javascript'

  // Check if any file is runnable
  const hasRunnableFiles = files.some((f) => runnableLanguages.includes(f.language.toLowerCase()))

  // Find entry point (index.js, main.js, app.js, or first JS file)
  const findEntryPoint = (): string => {
    const entryNames = ['index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts']
    for (const name of entryNames) {
      if (files.find((f) => f.name.toLowerCase() === name)) {
        return name
      }
    }
    const jsFile = files.find((f) => runnableLanguages.includes(f.language.toLowerCase()))
    return jsFile?.name || files[0]?.name || ''
  }

  const updateFileCode = (code: string) => {
    setFiles((prev) => prev.map((f) => (f.name === activeFile ? { ...f, code } : f)))
  }

  const openFile = (name: string) => {
    setActiveFile(name)
    if (!openTabs.includes(name)) {
      setOpenTabs((prev) => [...prev, name])
    }
  }

  const closeTab = (name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newTabs = openTabs.filter((t) => t !== name)
    setOpenTabs(newTabs)
    if (activeFile === name && newTabs.length > 0) {
      setActiveFile(newTabs[newTabs.length - 1])
    }
  }

  const runProject = () => {
    if (!hasRunnableFiles) return

    setIsRunning(true)
    setShowOutput(true)
    setOutput(['Building project...'])

    const logs: string[] = []

    try {
      // Build a module system
      const modules: Record<string, any> = {}
      const moduleCache: Record<string, any> = {}

      // Create custom console
      const customConsole = {
        log: (...args: any[]) => logs.push(args.map(formatOutput).join(' ')),
        error: (...args: any[]) => logs.push(`[Error] ${args.map(formatOutput).join(' ')}`),
        warn: (...args: any[]) => logs.push(`[Warn] ${args.map(formatOutput).join(' ')}`),
        info: (...args: any[]) => logs.push(`[Info] ${args.map(formatOutput).join(' ')}`),
        table: (data: any) => logs.push(JSON.stringify(data, null, 2)),
        clear: () => (logs.length = 0),
      }

      // Process each file and create module factories
      files.forEach((file) => {
        if (!runnableLanguages.includes(file.language.toLowerCase())) return

        // Transform imports/exports to CommonJS
        let code = file.code
        const exportedNames: string[] = []

        // Handle ES6 imports: import { x, y } from './file'
        code = code.replace(
          /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g,
          (_, imports, path) => {
            const cleanPath = path.replace(/^\.\//, '').replace(/\.(js|ts|jsx|tsx)$/, '')
            return `const {${imports}} = require('${cleanPath}')`
          }
        )

        // Handle default imports: import x from './file'
        code = code.replace(
          /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
          (_, name, path) => {
            const cleanPath = path.replace(/^\.\//, '').replace(/\.(js|ts|jsx|tsx)$/, '')
            return `const ${name} = require('${cleanPath}').default || require('${cleanPath}')`
          }
        )

        // Handle: export default class Name { or export default function Name(
        code = code.replace(
          /export\s+default\s+(class|function)\s+(\w+)/g,
          (_, type, name) => {
            exportedNames.push(`default:${name}`)
            return `${type} ${name}`
          }
        )

        // Handle: export default <identifier> (at end of file, like "export default Calculator")
        code = code.replace(
          /export\s+default\s+(\w+)\s*$/gm,
          (_, name) => {
            exportedNames.push(`default:${name}`)
            return `// export default ${name}`
          }
        )

        // Handle: export default <expression> (inline)
        code = code.replace(/export\s+default\s+/g, 'module.exports.default = ')

        // Handle: export function name() or export class Name
        code = code.replace(
          /export\s+(function|class)\s+(\w+)/g,
          (_, type, name) => {
            exportedNames.push(name)
            return `${type} ${name}`
          }
        )

        // Handle: export const/let/var name =
        code = code.replace(
          /export\s+(const|let|var)\s+(\w+)\s*=/g,
          (_, type, name) => {
            exportedNames.push(name)
            return `${type} ${name} =`
          }
        )

        // Handle: export { x, y }
        code = code.replace(/export\s+\{([^}]+)\}/g, (_, exports) => {
          const names = exports.split(',').map((n: string) => n.trim())
          names.forEach((n: string) => exportedNames.push(n))
          return '' // Remove the export statement, we'll add exports at the end
        })

        // Add module.exports at the end for collected exports
        if (exportedNames.length > 0) {
          const exportStatements = exportedNames.map((name) => {
            if (name.startsWith('default:')) {
              const actualName = name.replace('default:', '')
              return `module.exports.default = ${actualName}`
            }
            return `module.exports.${name} = ${name}`
          })
          code = code + '\n' + exportStatements.join(';\n')
        }

        const fileName = file.name.replace(/\.(js|ts|jsx|tsx)$/, '')
        modules[fileName] = code
        modules[file.name] = code // Also store with extension
      })

      // Create require function
      const createRequire = () => {
        return (moduleName: string) => {
          const cleanName = moduleName.replace(/^\.\//, '').replace(/\.(js|ts|jsx|tsx)$/, '')

          if (moduleCache[cleanName]) {
            return moduleCache[cleanName]
          }

          const moduleCode = modules[cleanName]
          if (!moduleCode) {
            throw new Error(`Module not found: ${moduleName}`)
          }

          const moduleObj = { exports: {} }
          moduleCache[cleanName] = moduleObj.exports

          try {
            const moduleFunc = new Function('module', 'exports', 'require', 'console', moduleCode)
            moduleFunc(moduleObj, moduleObj.exports, createRequire(), customConsole)
            moduleCache[cleanName] = moduleObj.exports
          } catch (e: any) {
            logs.push(`[Error in ${cleanName}] ${e.message}`)
          }

          return moduleCache[cleanName]
        }
      }

      // Find and run entry point
      const entry = findEntryPoint()
      logs.push(`Running ${entry}...\n`)

      const entryCode = modules[entry.replace(/\.(js|ts|jsx|tsx)$/, '')]
      if (entryCode) {
        const moduleObj = { exports: {} }
        const entryFunc = new Function('module', 'exports', 'require', 'console', entryCode)
        entryFunc(moduleObj, moduleObj.exports, createRequire(), customConsole)
      } else {
        logs.push(`[Error] Entry point not found: ${entry}`)
      }

      if (logs.length === 1) {
        logs.push('(No output)')
      }

      setOutput(logs)
    } catch (error: any) {
      setOutput([...logs, `[Error] ${error.message}`])
    }

    setIsRunning(false)
  }

  const formatOutput = (value: any): string => {
    if (value === undefined) return 'undefined'
    if (value === null) return 'null'
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2)
      } catch {
        return String(value)
      }
    }
    return String(value)
  }

  const handleCopy = async () => {
    if (currentFile) {
      await navigator.clipboard.writeText(currentFile.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const downloadAll = () => {
    files.forEach((file) => {
      const blob = new Blob([file.code], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  // Handle ESC to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-6xl h-[90vh] flex flex-col rounded-2xl overflow-hidden bg-[#1e1e1e] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#323233] border-b border-[#3d3d3d]">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <button onClick={onClose} className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-110" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#27ca40]" />
            </div>
            <span className="text-sm font-medium text-gray-300 ml-2">Stack IDE</span>
          </div>

          <div className="flex items-center gap-2">
            {hasRunnableFiles && (
              <button
                onClick={runProject}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-green-800 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Play size={14} />
                {isRunning ? 'Running...' : 'Run Project'}
              </button>
            )}
            <button onClick={handleCopy} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Copy">
              {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-gray-400" />}
            </button>
            <button onClick={downloadAll} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Download All">
              <Download size={18} className="text-gray-400" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors ml-2" title="Close">
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Explorer */}
          <AnimatePresence>
            {showExplorer && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 200 }}
                exit={{ width: 0 }}
                className="bg-[#252526] border-r border-[#3d3d3d] overflow-hidden"
              >
                <div className="p-2">
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-gray-400 uppercase">
                    <FolderOpen size={14} />
                    Explorer
                  </div>
                  <div className="mt-2">
                    {files.map((file) => {
                      const langColor = languageColors[file.language.toLowerCase()] || '#6b7280'
                      return (
                        <button
                          key={file.name}
                          onClick={() => openFile(file.name)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors ${
                            activeFile === file.name
                              ? 'bg-[#37373d] text-white'
                              : 'text-gray-400 hover:bg-[#2a2d2e] hover:text-gray-200'
                          }`}
                        >
                          <FileCode size={14} style={{ color: langColor }} />
                          <span className="truncate">{file.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Editor Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex items-center bg-[#252526] border-b border-[#3d3d3d] overflow-x-auto">
              <button
                onClick={() => setShowExplorer(!showExplorer)}
                className="p-2 hover:bg-white/10 transition-colors border-r border-[#3d3d3d]"
              >
                <ChevronRight size={16} className={`text-gray-400 transition-transform ${showExplorer ? 'rotate-180' : ''}`} />
              </button>
              {openTabs.map((tab) => {
                const file = files.find((f) => f.name === tab)
                const langColor = file ? languageColors[file.language.toLowerCase()] || '#6b7280' : '#6b7280'
                return (
                  <div
                    key={tab}
                    onClick={() => setActiveFile(tab)}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-r border-[#3d3d3d] ${
                      activeFile === tab ? 'bg-[#1e1e1e] text-white' : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <FileCode size={14} style={{ color: langColor }} />
                    <span className="text-sm">{tab}</span>
                    <button
                      onClick={(e) => closeTab(tab, e)}
                      className="ml-1 p-0.5 hover:bg-white/20 rounded"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Editor */}
            <div className={`${showOutput ? 'h-[55%]' : 'flex-1'} overflow-hidden`}>
              {currentFile && (
                <AceEditor
                  mode={mode}
                  theme="one_dark"
                  value={currentFile.code}
                  onChange={updateFileCode}
                  name="multi-file-editor"
                  width="100%"
                  height="100%"
                  fontSize={14}
                  showPrintMargin={false}
                  showGutter={true}
                  highlightActiveLine={true}
                  setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                    showLineNumbers: true,
                    tabSize: 2,
                    useWorker: false,
                  }}
                  editorProps={{ $blockScrolling: true }}
                />
              )}
            </div>

            {/* Output Panel */}
            <AnimatePresence>
              {showOutput && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: '45%' }}
                  exit={{ height: 0 }}
                  className="border-t border-[#3d3d3d] bg-[#1e1e1e] overflow-hidden flex flex-col"
                >
                  <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3d3d3d]">
                    <div className="flex items-center gap-2">
                      <Terminal size={14} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-300">Output</span>
                    </div>
                    <button
                      onClick={() => {
                        setOutput([])
                        setShowOutput(false)
                      }}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                      title="Clear"
                    >
                      <Trash2 size={14} className="text-gray-400" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-4 font-mono text-sm">
                    {output.map((line, i) => (
                      <div
                        key={i}
                        className={`whitespace-pre-wrap ${
                          line.startsWith('[Error')
                            ? 'text-red-400'
                            : line.startsWith('[Warn]')
                            ? 'text-yellow-400'
                            : line.startsWith('[Info]')
                            ? 'text-blue-400'
                            : line.startsWith('Running')
                            ? 'text-green-400'
                            : 'text-gray-300'
                        }`}
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-4 py-1 bg-[#007acc] text-white text-xs">
          <div className="flex items-center gap-4">
            <span>{files.length} files</span>
            {currentFile && <span>{currentFile.code.split('\n').length} lines</span>}
          </div>
          <div className="flex items-center gap-4">
            {hasRunnableFiles && <span>Entry: {findEntryPoint()}</span>}
            <span>ESC to close</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default MultiFileIDE
