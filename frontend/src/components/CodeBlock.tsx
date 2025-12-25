import { useState } from 'react'
import { Copy, Check, Download, FileCode, ChevronRight, X, Play, Code2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CodeRunner } from './CodeRunner'
import { SandpackIDE } from './SandpackIDE'

interface CodeBlockProps {
  code: string
  language: string
  filename?: string
  showLineNumbers?: boolean
}

const languageColors: Record<string, string> = {
  typescript: '#3178c6',
  javascript: '#f7df1e',
  tsx: '#3178c6',
  jsx: '#61dafb',
  bash: '#4eaa25',
  shell: '#4eaa25',
  json: '#292929',
  css: '#264de4',
  html: '#e34c26',
  python: '#3776ab',
  rust: '#dea584',
  go: '#00add8',
}

const languageIcons: Record<string, string> = {
  typescript: 'TS',
  javascript: 'JS',
  tsx: 'TSX',
  jsx: 'JSX',
  bash: '$',
  shell: '$',
  json: '{}',
  css: '#',
  html: '<>',
  python: 'PY',
  rust: 'RS',
  go: 'GO',
}

export const CodeBlock = ({ code, language, filename, showLineNumbers = true }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `code.${language}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const lines = code.trim().split('\n')
  const langColor = languageColors[language] || '#6b7280'

  return (
    <div className="rounded-xl overflow-hidden bg-[#1e1e1e] shadow-xl my-6">
      {/* IDE Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#3d3d3d]">
        <div className="flex items-center gap-3">
          {/* Traffic lights */}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27ca40]" />
          </div>
          {/* Filename tab */}
          {filename && (
            <div className="flex items-center gap-2 px-3 py-1 bg-[#1e1e1e] rounded-t-lg -mb-2 ml-2">
              <FileCode size={14} className="text-gray-400" />
              <span className="text-sm text-gray-300">{filename}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Language badge */}
          <span 
            className="px-2 py-0.5 text-xs font-mono rounded"
            style={{ backgroundColor: langColor + '20', color: langColor }}
          >
            {languageIcons[language] || language.toUpperCase()}
          </span>
          {/* Actions */}
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title="Copy code"
          >
            {copied ? (
              <Check size={16} className="text-green-400" />
            ) : (
              <Copy size={16} className="text-gray-400" />
            )}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title="Download file"
          >
            <Download size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto">
        <pre className="p-4 text-sm font-mono">
          <code>
            {lines.map((line, i) => (
              <div key={i} className="flex">
                {showLineNumbers && (
                  <span className="select-none text-gray-600 w-8 text-right pr-4 shrink-0">
                    {i + 1}
                  </span>
                )}
                <span className="text-gray-200">{line || ' '}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  )
}

// File item for the sidebar
interface FileItem {
  name: string
  language: string
  code: string
}

// File Modal Component
interface FileModalProps {
  file: FileItem | null
  onClose: () => void
}

const runnableLanguages = ['javascript', 'typescript', 'js', 'ts', 'jsx', 'tsx']

export const FileModal = ({ file, onClose }: FileModalProps) => {
  const [copied, setCopied] = useState(false)
  const [showRunner, setShowRunner] = useState(false)

  if (!file) return null

  const canRun = runnableLanguages.includes(file.language.toLowerCase())

  const handleCopy = async () => {
    await navigator.clipboard.writeText(file.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([file.code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
  }

  // Show CodeRunner if user clicked Run
  if (showRunner) {
    return (
      <CodeRunner
        initialCode={file.code}
        language={file.language}
        filename={file.name}
        onClose={() => setShowRunner(false)}
      />
    )
  }

  const lines = file.code.trim().split('\n')
  const langColor = languageColors[file.language] || '#6b7280'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-8"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden bg-[#1e1e1e] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* IDE Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#2d2d2d] border-b border-[#3d3d3d]">
            <div className="flex items-center gap-3">
              {/* Traffic lights */}
              <div className="flex gap-2">
                <button onClick={onClose} className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-110" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27ca40]" />
              </div>
              {/* Filename */}
              <div className="flex items-center gap-2 ml-4">
                <FileCode size={16} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-200">{file.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Run button for JS/TS */}
              {canRun && (
                <button
                  onClick={() => setShowRunner(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Play size={14} />
                  Run & Edit
                </button>
              )}
              {/* Language badge */}
              <span 
                className="px-2 py-0.5 text-xs font-mono rounded"
                style={{ backgroundColor: langColor + '20', color: langColor }}
              >
                {languageIcons[file.language] || file.language.toUpperCase()}
              </span>
              {/* Actions */}
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-white/10 rounded transition-colors"
                title="Copy code"
              >
                {copied ? (
                  <Check size={18} className="text-green-400" />
                ) : (
                  <Copy size={18} className="text-gray-400" />
                )}
              </button>
              <button
                onClick={handleDownload}
                className="p-2 hover:bg-white/10 rounded transition-colors"
                title="Download file"
              >
                <Download size={18} className="text-gray-400" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded transition-colors ml-2"
                title="Close"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Code content */}
          <div className="flex-1 overflow-auto">
            <pre className="p-4 text-sm font-mono">
              <code>
                {lines.map((line, i) => (
                  <div key={i} className="flex hover:bg-white/5">
                    <span className="select-none text-gray-600 w-12 text-right pr-4 shrink-0 border-r border-[#3d3d3d] mr-4">
                      {i + 1}
                    </span>
                    <span className="text-gray-200">{line || ' '}</span>
                  </div>
                ))}
              </code>
            </pre>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-t border-[#3d3d3d] text-xs text-gray-500">
            <span>{lines.length} lines</span>
            <div className="flex items-center gap-4">
              {canRun && <span className="text-green-500">Click "Run & Edit" to execute</span>}
              <span>Press ESC to close</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

interface FilesSidebarProps {
  files: FileItem[]
  activeFile: string | null
  onSelectFile: (name: string) => void
}

export const FilesSidebar = ({ files, activeFile, onSelectFile }: FilesSidebarProps) => {
  const [isOpen, setIsOpen] = useState(true)
  const [showIDE, setShowIDE] = useState(false)

  // Check if there are runnable files
  const hasRunnableFiles = files.some((f) =>
    runnableLanguages.includes(f.language.toLowerCase())
  )

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

  return (
    <>
      <div className="bg-[#252526] rounded-xl overflow-hidden h-fit sticky top-8">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#2d2d2d] border-b border-[#3d3d3d]">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400 hover:text-white">
              <ChevronRight
                size={16}
                className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}
              />
            </button>
            <span className="text-sm font-medium text-gray-300">Project Files</span>
          </div>
          <button
            onClick={downloadAll}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
          >
            <Download size={12} />
            All
          </button>
        </div>

        {/* File list */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-2">
                {files.map((file) => {
                  const langColor = languageColors[file.language] || '#6b7280'
                  return (
                    <button
                      key={file.name}
                      onClick={() => onSelectFile(file.name)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeFile === file.name
                          ? 'bg-[#37373d] text-white'
                          : 'text-gray-400 hover:bg-[#2a2d2e] hover:text-gray-200'
                      }`}
                    >
                      <span
                        className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded"
                        style={{ backgroundColor: langColor + '30', color: langColor }}
                      >
                        {languageIcons[file.language] || '?'}
                      </span>
                      <span className="text-sm truncate">{file.name}</span>
                    </button>
                  )
                })}
              </div>

              {/* Open IDE Button */}
              {hasRunnableFiles && files.length > 1 && (
                <div className="p-2 pt-0">
                  <button
                    onClick={() => setShowIDE(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Code2 size={16} />
                    Open in IDE
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sandpack IDE Modal */}
      {showIDE && <SandpackIDE files={files} onClose={() => setShowIDE(false)} />}
    </>
  )
}

export default CodeBlock
