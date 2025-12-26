import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
  SandpackConsole,
  useSandpack,
} from '@codesandbox/sandpack-react'
import { atomDark } from '@codesandbox/sandpack-themes'
import { X, Maximize2, Minimize2, Terminal, Eye, Play, RotateCcw, Copy, Check, FileCode } from 'lucide-react'
import { motion } from 'framer-motion'

interface FileItem {
  name: string
  language: string
  code: string
}

interface SandpackIDEProps {
  files: FileItem[]
  entryFile?: string
  onClose: () => void
  title?: string
}

// Convert files to Sandpack format
const toSandpackFiles = (files: FileItem[]): Record<string, string> => {
  const spFiles: Record<string, string> = {}
  files.forEach((file) => {
    const path = file.name.startsWith('/') ? file.name : `/${file.name}`
    spFiles[path] = file.code
  })
  return spFiles
}

// Detect template from files
const detectTemplate = (files: FileItem[]): 'vanilla' | 'vanilla-ts' | 'react' | 'react-ts' | 'node' => {
  const fileNames = files.map((f) => f.name.toLowerCase())
  const hasTs = fileNames.some((f) => f.endsWith('.ts') || f.endsWith('.tsx'))
  const hasReact = files.some((f) =>
    f.code.includes('import React') || f.code.includes('from "react"') || f.code.includes("from 'react'")
  )
  const hasJsx = fileNames.some((f) => f.endsWith('.jsx') || f.endsWith('.tsx'))

  if (hasReact || hasJsx) return hasTs ? 'react-ts' : 'react'
  return hasTs ? 'vanilla-ts' : 'vanilla'
}

// Auto-detect dependencies from imports
const detectDependencies = (files: FileItem[]): Record<string, string> => {
  const deps: Record<string, string> = {}
  const builtins = ['react', 'react-dom', 'react/jsx-runtime']
  
  files.forEach((file) => {
    // Match import statements: import x from 'package' or import 'package'
    const importRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"./][^'"]*)['"]/g
    let match
    while ((match = importRegex.exec(file.code)) !== null) {
      const pkg = match[1].split('/')[0] // Get base package name
      if (!builtins.includes(pkg) && !deps[pkg]) {
        deps[pkg] = 'latest'
      }
    }
    
    // Detect Tailwind from @tailwind directives or config files
    if (file.code.includes('@tailwind') || file.name.includes('tailwind.config')) {
      deps['tailwindcss'] = 'latest'
      deps['autoprefixer'] = 'latest'
      deps['postcss'] = 'latest'
    }
  })
  
  return deps
}

// Create entry file if needed
const ensureEntryFile = (files: FileItem[], template: string): Record<string, string> => {
  const spFiles = toSandpackFiles(files)

  const hasIndex = Object.keys(spFiles).some(
    (f) =>
      f === '/index.js' ||
      f === '/index.ts' ||
      f === '/index.jsx' ||
      f === '/index.tsx' ||
      f === '/src/index.js' ||
      f === '/src/index.ts'
  )

  if (!hasIndex && Object.keys(spFiles).length > 0) {
    const mainFile = Object.keys(spFiles).find(
      (f) => f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.jsx') || f.endsWith('.tsx')
    )

    if (mainFile) {
      const ext = template.includes('ts') ? 'ts' : 'js'
      const importPath = mainFile.replace(/^\//, './').replace(/\.(js|ts|jsx|tsx)$/, '')
      spFiles[`/index.${ext}`] = `// Entry point\nimport '${importPath}';\n`
    }
  }

  return spFiles
}

// Status bar component
const StatusBar = ({ fileCount }: { fileCount: number }) => {
  const { sandpack } = useSandpack()
  const status = sandpack.status

  return (
    <div className="flex items-center justify-between h-6 px-3 bg-[#007acc] text-white text-[11px] shrink-0">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <FileCode size={12} />
          {fileCount} files
        </span>
        <span className="flex items-center gap-1">
          {status === 'running' && (
            <>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Running
            </>
          )}
          {status === 'idle' && (
            <>
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              Ready
            </>
          )}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span>Sandpack</span>
        <span className="opacity-60">ESC to close</span>
      </div>
    </div>
  )
}

// Toolbar with run controls
const Toolbar = ({
  activeView,
  setActiveView,
}: {
  activeView: 'preview' | 'console'
  setActiveView: (v: 'preview' | 'console') => void
}) => {
  const { sandpack } = useSandpack()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const activeCode = sandpack.files[sandpack.activeFile]?.code || ''
    await navigator.clipboard.writeText(activeCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRun = () => {
    sandpack.runSandpack()
  }

  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-[#333] shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={handleRun}
          className="flex items-center gap-1.5 px-3 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
        >
          <Play size={12} fill="white" />
          Run
        </button>
        <button
          onClick={() => sandpack.resetAllFiles()}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
          title="Reset files"
        >
          <RotateCcw size={12} />
        </button>
        <div className="w-px h-4 bg-gray-600 mx-1" />
        <button
          onClick={() => setActiveView('console')}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${
            activeView === 'console' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Terminal size={12} />
          Console
        </button>
        <button
          onClick={() => setActiveView('preview')}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${
            activeView === 'preview' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Eye size={12} />
          Preview
        </button>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
          title="Copy current file"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
        </button>
      </div>
    </div>
  )
}

export const SandpackIDE = ({
  files: initialFiles,
  entryFile,
  onClose,
  title = 'Code Playground',
}: SandpackIDEProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeView, setActiveView] = useState<'preview' | 'console'>('preview')

  const template = detectTemplate(initialFiles)
  const sandpackFiles = ensureEntryFile(initialFiles, template)
  const dependencies = detectDependencies(initialFiles)

  let activeFile = entryFile ? (entryFile.startsWith('/') ? entryFile : `/${entryFile}`) : undefined
  if (!activeFile) {
    const entryNames = ['/index.js', '/index.ts', '/index.jsx', '/index.tsx', '/src/index.js', '/src/index.ts']
    activeFile = entryNames.find((n) => sandpackFiles[n]) || Object.keys(sandpackFiles)[0]
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) setIsFullscreen(false)
        else onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, isFullscreen])

  const customTheme = {
    ...atomDark,
    colors: {
      ...atomDark.colors,
      surface1: '#1e1e1e',
      surface2: '#252526',
      surface3: '#2d2d2d',
    },
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className={`relative flex flex-col overflow-hidden bg-[#1e1e1e] shadow-2xl border border-[#333] ${
          isFullscreen ? 'w-full h-full' : 'w-[95vw] max-w-7xl h-[92vh] rounded-lg'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between h-9 px-3 bg-[#323233] border-b border-[#252526] select-none shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <button
                onClick={onClose}
                className="w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff5f57]/80 transition-colors"
              />
              <button
                onClick={() => setIsFullscreen(false)}
                className="w-3 h-3 rounded-full bg-[#febc2e] hover:bg-[#febc2e]/80 transition-colors"
              />
              <button
                onClick={() => setIsFullscreen(true)}
                className="w-3 h-3 rounded-full bg-[#28c840] hover:bg-[#28c840]/80 transition-colors"
              />
            </div>
            <span className="text-xs text-gray-400 ml-2 font-medium">{title}</span>
            <span className="text-[10px] text-gray-500 ml-2 px-1.5 py-0.5 bg-gray-700/50 rounded">{template}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 size={14} className="text-gray-400" />
              ) : (
                <Maximize2 size={14} className="text-gray-400" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              title="Close (Esc)"
            >
              <X size={14} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Sandpack IDE */}
        <SandpackProvider
          template={template}
          files={sandpackFiles}
          theme={customTheme}
          customSetup={{
            dependencies,
          }}
          options={{
            activeFile,
            visibleFiles: Object.keys(sandpackFiles),
            recompileMode: 'delayed',
            recompileDelay: 300,
          }}
        >
          <div className="flex-1 flex flex-col overflow-hidden">
            <Toolbar activeView={activeView} setActiveView={setActiveView} />

            {/* Main Layout */}
            <div className="flex-1 overflow-hidden sp-ide-layout">
              <style>{`
                .sp-ide-layout,
                .sp-ide-layout > div,
                .sp-ide-layout .sp-layout,
                .sp-ide-layout .sp-stack {
                  height: 100% !important;
                }
                .sp-ide-layout .sp-layout {
                  display: flex !important;
                  flex-direction: row !important;
                  background: #1e1e1e !important;
                  gap: 0 !important;
                }
                .sp-ide-layout .sp-file-explorer {
                  height: 100% !important;
                  width: 200px !important;
                  min-width: 200px !important;
                  max-width: 200px !important;
                  flex-shrink: 0 !important;
                  border-right: 1px solid #333 !important;
                  background: #252526 !important;
                }
                .sp-ide-layout .sp-code-editor {
                  height: 100% !important;
                  flex: 1 1 auto !important;
                  min-width: 0 !important;
                }
                .sp-ide-layout .sp-code-editor .cm-editor {
                  height: 100% !important;
                }
                .sp-ide-layout .sp-code-editor .cm-scroller {
                  overflow: auto !important;
                }
                .sp-ide-layout .sp-tabs {
                  background: #252526 !important;
                  border-bottom: 1px solid #333 !important;
                }
                .sp-ide-layout .sp-tab-button {
                  border: none !important;
                }
                .sp-ide-layout .sp-preview-container,
                .sp-ide-layout .sp-console-wrapper,
                .sp-ide-layout .sp-preview,
                .sp-ide-layout .sp-console {
                  height: 100% !important;
                  background: #1e1e1e !important;
                }
                .sp-ide-layout .sp-preview iframe {
                  height: 100% !important;
                }
                .sp-ide-layout .sp-console {
                  font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
                }
              `}</style>
              <SandpackLayout style={{ height: '100%' }} className="!rounded-none !border-0">
                <SandpackFileExplorer />
                <SandpackCodeEditor showTabs showLineNumbers showInlineErrors wrapContent />
                <div
                  style={{
                    width: 420,
                    minWidth: 420,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderLeft: '1px solid #333',
                    background: '#1e1e1e',
                  }}
                >
                  {activeView === 'preview' ? (
                    <SandpackPreview style={{ height: '100%', width: '100%' }} showNavigator showRefreshButton />
                  ) : (
                    <SandpackConsole style={{ height: '100%', width: '100%' }} showHeader showResetConsoleButton />
                  )}
                </div>
              </SandpackLayout>
            </div>

            <StatusBar fileCount={Object.keys(sandpackFiles).length} />
          </div>
        </SandpackProvider>
      </motion.div>
    </motion.div>,
    document.body
  )
}

export default SandpackIDE
