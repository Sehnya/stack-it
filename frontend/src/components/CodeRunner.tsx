import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { Play, Square, Copy, Check, Download, Trash2, Terminal, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CodeRunnerProps {
  initialCode: string
  language: string
  filename: string
  onClose: () => void
}

const languageToMonaco: Record<string, string> = {
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
  bash: 'shell',
  shell: 'shell',
  sh: 'shell',
}

const runnableLanguages = ['javascript', 'typescript', 'js', 'ts', 'jsx', 'tsx']

export const CodeRunner = ({ initialCode, language, filename, onClose }: CodeRunnerProps) => {
  const [code, setCode] = useState(initialCode)
  const [output, setOutput] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showOutput, setShowOutput] = useState(false)

  const monacoLang = languageToMonaco[language.toLowerCase()] || 'plaintext'
  const canRun = runnableLanguages.includes(language.toLowerCase())

  const runCode = () => {
    if (!canRun) return

    setIsRunning(true)
    setShowOutput(true)
    setOutput(['Running...'])

    const logs: string[] = []

    try {
      const customConsole = {
        log: (...args: any[]) => logs.push(args.map(formatOutput).join(' ')),
        error: (...args: any[]) => logs.push(`[Error] ${args.map(formatOutput).join(' ')}`),
        warn: (...args: any[]) => logs.push(`[Warn] ${args.map(formatOutput).join(' ')}`),
        info: (...args: any[]) => logs.push(`[Info] ${args.map(formatOutput).join(' ')}`),
        table: (data: any) => logs.push(JSON.stringify(data, null, 2)),
        clear: () => (logs.length = 0),
      }

      const wrappedCode = `(function(console) { ${code} })`
      const executeCode = (0, eval)(wrappedCode)
      executeCode(customConsole)

      if (logs.length === 0) {
        logs.push('(No output)')
      }

      setOutput(logs)
    } catch (error: any) {
      setOutput([`[Error] ${error.message}`])
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
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

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
        className="relative w-full max-w-5xl h-[85vh] flex flex-col rounded-xl overflow-hidden bg-[#1e1e1e] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#323233] border-b border-[#3d3d3d]">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <button onClick={onClose} className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-110" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#27ca40]" />
            </div>
            <div className="flex items-center gap-2 ml-4 px-3 py-1 bg-[#1e1e1e] rounded-lg">
              <Terminal size={14} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-200">{filename}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canRun && (
              <button
                onClick={runCode}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-green-800 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isRunning ? (
                  <>
                    <Square size={14} />
                    Running
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    Run
                  </>
                )}
              </button>
            )}
            <button onClick={handleCopy} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Copy">
              {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-gray-400" />}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Download"
            >
              <Download size={18} className="text-gray-400" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors ml-2" title="Close">
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Editor and Output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor */}
          <div className={`${showOutput ? 'h-[60%]' : 'flex-1'} overflow-hidden`}>
            <Editor
              height="100%"
              language={monacoLang}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                padding: { top: 16 },
              }}
            />
          </div>

          {/* Output Panel */}
          <AnimatePresence>
            {showOutput && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: '40%' }}
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
                    title="Clear output"
                  >
                    <Trash2 size={14} className="text-gray-400" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-4 font-mono text-sm">
                  {output.map((line, i) => (
                    <div
                      key={i}
                      className={`whitespace-pre-wrap ${
                        line.startsWith('[Error]')
                          ? 'text-red-400'
                          : line.startsWith('[Warn]')
                            ? 'text-yellow-400'
                            : line.startsWith('[Info]')
                              ? 'text-blue-400'
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

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-1 bg-[#007acc] text-white text-xs">
          <div className="flex items-center gap-4">
            <span>{code.split('\n').length} lines</span>
            <span>{monacoLang}</span>
          </div>
          <div className="flex items-center gap-4">
            {canRun && <span className="text-green-300">Runnable</span>}
            <span>ESC to close</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default CodeRunner
