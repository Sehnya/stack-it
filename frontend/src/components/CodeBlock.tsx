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
  json: '#f5a623',
  css: '#264de4',
  html: '#e34c26',
  python: '#3776ab',
  rust: '#dea584',
  go: '#00add8',
  prisma: '#5a67d8',
}

// High-contrast syntax highlighting colors (VS Code Dark+ inspired)
const syntaxColors = {
  keyword: '#ff79c6',      // bright pink - if, const, let, function, return
  string: '#f1fa8c',       // bright yellow - strings
  number: '#bd93f9',       // purple - numbers
  comment: '#6272a4',      // muted blue - comments
  function: '#50fa7b',     // bright green - function names
  variable: '#8be9fd',     // cyan - variables
  type: '#ffb86c',         // orange - types, classes
  property: '#8be9fd',     // cyan - object properties
  operator: '#ff79c6',     // pink - operators
  punctuation: '#f8f8f2',  // white - brackets, etc.
  tag: '#ff79c6',          // pink - HTML tags
  attribute: '#50fa7b',    // green - HTML attributes
  decorator: '#ffb86c',    // orange - decorators
  default: '#f8f8f2',      // bright white - default text
}

interface Token {
  text: string
  color: string
}

function tokenizeLine(line: string, language: string): Token[] {
  const tokens: Token[] = []
  
  // Language-specific keywords
  const jsKeywords = /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|class|extends|import|export|from|default|async|await|yield|typeof|instanceof|in|of|true|false|null|undefined|this|super|static|get|set|constructor|interface|type|enum|implements|public|private|protected|readonly)\b/g
  const typeKeywords = /\b(string|number|boolean|void|any|never|unknown|object|symbol|bigint|Int|String|Float|Boolean|DateTime|Array|Promise|Record|Partial|Required|Pick|Omit)\b/g
  const prismaKeywords = /\b(model|datasource|generator|enum|type|relation|fields|references|onDelete|onUpdate|default|unique|id|map|autoincrement|now|Cascade|SetNull|Restrict)\b/g
  const decorators = /@\w+/g
  
  // Common patterns
  const patterns: Array<{ regex: RegExp; color: string }> = [
    // Comments first (highest priority)
    { regex: /(\/\/.*$)/g, color: syntaxColors.comment },
    { regex: /(#.*$)/g, color: syntaxColors.comment },
    // Strings (double, single, template)
    { regex: /("(?:[^"\\]|\\.)*")/g, color: syntaxColors.string },
    { regex: /('(?:[^'\\]|\\.)*')/g, color: syntaxColors.string },
    { regex: /(`(?:[^`\\]|\\.)*`)/g, color: syntaxColors.string },
    // Numbers
    { regex: /\b(\d+\.?\d*)\b/g, color: syntaxColors.number },
    // Decorators/attributes
    { regex: decorators, color: syntaxColors.decorator },
  ]
  
  // Add language-specific patterns
  if (['javascript', 'typescript', 'js', 'ts', 'jsx', 'tsx'].includes(language)) {
    patterns.push(
      { regex: jsKeywords, color: syntaxColors.keyword },
      { regex: typeKeywords, color: syntaxColors.type },
      { regex: /\b([A-Z][a-zA-Z0-9]*)\b/g, color: syntaxColors.type },
      { regex: /\b(\w+)(?=\s*\()/g, color: syntaxColors.function },
    )
  } else if (language === 'prisma') {
    patterns.push(
      { regex: prismaKeywords, color: syntaxColors.keyword },
      { regex: typeKeywords, color: syntaxColors.type },
      { regex: /\b([A-Z][a-zA-Z0-9]*)\b/g, color: syntaxColors.type },
    )
  } else if (['html', 'xml'].includes(language)) {
    patterns.push(
      { regex: /<\/?[\w-]+/g, color: syntaxColors.tag },
      { regex: /\b[\w-]+(?==)/g, color: syntaxColors.attribute },
    )
  } else if (language === 'css') {
    patterns.push(
      { regex: /[.#][\w-]+/g, color: syntaxColors.function },
      { regex: /[\w-]+(?=\s*:)/g, color: syntaxColors.property },
    )
  } else if (['bash', 'shell', 'sh'].includes(language)) {
    patterns.push(
      { regex: /\b(echo|cd|ls|mkdir|rm|cp|mv|cat|grep|sed|awk|chmod|chown|sudo|apt|npm|yarn|bun|bunx|git|docker|export|source)\b/g, color: syntaxColors.keyword },
      { regex: /\$[\w]+/g, color: syntaxColors.variable },
      { regex: /--[\w-]+/g, color: syntaxColors.property },
    )
  } else if (language === 'json') {
    patterns.push(
      { regex: /"[\w]+"\s*(?=:)/g, color: syntaxColors.property },
    )
  }
  
  interface Match {
    start: number
    end: number
    text: string
    color: string
  }
  
  const matches: Match[] = []
  
  for (const pattern of patterns) {
    let match
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags)
    while ((match = regex.exec(line)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        color: pattern.color,
      })
    }
  }
  
  matches.sort((a, b) => a.start - b.start)
  
  const filteredMatches: Match[] = []
  let lastEnd = 0
  for (const match of matches) {
    if (match.start >= lastEnd) {
      filteredMatches.push(match)
      lastEnd = match.end
    }
  }
  
  let pos = 0
  for (const match of filteredMatches) {
    if (match.start > pos) {
      tokens.push({ text: line.slice(pos, match.start), color: syntaxColors.default })
    }
    tokens.push({ text: match.text, color: match.color })
    pos = match.end
  }
  
  if (pos < line.length) {
    tokens.push({ text: line.slice(pos), color: syntaxColors.default })
  }
  
  if (tokens.length === 0) {
    tokens.push({ text: line || ' ', color: syntaxColors.default })
  }
  
  return tokens
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
  prisma: '◮',
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
    <div className="rounded-xl overflow-hidden shadow-2xl my-6 border border-[#44475a]" style={{ backgroundColor: '#282a36' }}>
      {/* IDE Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#44475a]" style={{ backgroundColor: '#21222c' }}>
        <div className="flex items-center gap-3">
          {/* Traffic lights */}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5555]" />
            <div className="w-3 h-3 rounded-full bg-[#f1fa8c]" />
            <div className="w-3 h-3 rounded-full bg-[#50fa7b]" />
          </div>
          {/* Filename tab */}
          {filename && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-t-lg -mb-2 ml-2 border-t border-x border-[#44475a]" style={{ backgroundColor: '#282a36' }}>
              <FileCode size={14} className="text-[#bd93f9]" />
              <span className="text-sm font-medium text-[#f8f8f2]">{filename}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Language badge */}
          <span 
            className="px-2.5 py-1 text-xs font-bold font-mono rounded-md border"
            style={{ backgroundColor: langColor + '20', color: langColor, borderColor: langColor + '40' }}
          >
            {languageIcons[language] || language.toUpperCase()}
          </span>
          {/* Actions */}
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
            title="Copy code"
          >
            {copied ? (
              <Check size={16} className="text-[#50fa7b]" />
            ) : (
              <Copy size={16} className="text-[#6272a4] hover:text-[#f8f8f2]" />
            )}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
            title="Download file"
          >
            <Download size={16} className="text-[#6272a4] hover:text-[#f8f8f2]" />
          </button>
        </div>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto">
        <pre className="p-4 text-sm leading-6" style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'SF Mono', Consolas, monospace" }}>
          <code>
            {lines.map((line, i) => (
              <div key={i} className="flex hover:bg-[#44475a]/30 -mx-4 px-4 min-h-[1.5rem]">
                {showLineNumbers && (
                  <span className="select-none w-10 text-right pr-4 shrink-0 font-mono" style={{ color: '#6272a4' }}>
                    {i + 1}
                  </span>
                )}
                <span className="flex-1">
                  {tokenizeLine(line, language).map((token, j) => (
                    <span key={j} style={{ color: token.color }}>{token.text}</span>
                  ))}
                </span>
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
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-[#44475a]"
          style={{ backgroundColor: '#282a36' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* IDE Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#44475a]" style={{ backgroundColor: '#21222c' }}>
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <button onClick={onClose} className="w-3 h-3 rounded-full bg-[#ff5555] hover:brightness-110" />
                <div className="w-3 h-3 rounded-full bg-[#f1fa8c]" />
                <div className="w-3 h-3 rounded-full bg-[#50fa7b]" />
              </div>
              <div className="flex items-center gap-2 ml-4">
                <FileCode size={16} className="text-[#bd93f9]" />
                <span className="text-sm font-medium text-[#f8f8f2]">{file.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canRun && (
                <button
                  onClick={() => setShowRunner(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#50fa7b] hover:bg-[#69ff94] text-[#282a36] text-sm font-bold rounded-lg transition-colors"
                >
                  <Play size={14} />
                  Run & Edit
                </button>
              )}
              <span 
                className="px-2.5 py-1 text-xs font-bold font-mono rounded-md border"
                style={{ backgroundColor: langColor + '20', color: langColor, borderColor: langColor + '40' }}
              >
                {languageIcons[file.language] || file.language.toUpperCase()}
              </span>
              <button onClick={handleCopy} className="p-2 hover:bg-white/10 rounded-md transition-colors" title="Copy code">
                {copied ? <Check size={18} className="text-[#50fa7b]" /> : <Copy size={18} className="text-[#6272a4] hover:text-[#f8f8f2]" />}
              </button>
              <button onClick={handleDownload} className="p-2 hover:bg-white/10 rounded-md transition-colors" title="Download file">
                <Download size={18} className="text-[#6272a4] hover:text-[#f8f8f2]" />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-md transition-colors ml-2" title="Close">
                <X size={18} className="text-[#6272a4] hover:text-[#f8f8f2]" />
              </button>
            </div>
          </div>

          {/* Code content */}
          <div className="flex-1 overflow-auto">
            <pre className="p-4 text-sm leading-6" style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'SF Mono', Consolas, monospace" }}>
              <code>
                {lines.map((line, i) => (
                  <div key={i} className="flex hover:bg-[#44475a]/30 min-h-[1.5rem]">
                    <span className="select-none w-12 text-right pr-4 shrink-0 border-r border-[#44475a] mr-4" style={{ color: '#6272a4' }}>
                      {i + 1}
                    </span>
                    <span className="flex-1">
                      {tokenizeLine(line, file.language).map((token, j) => (
                        <span key={j} style={{ color: token.color }}>{token.text}</span>
                      ))}
                    </span>
                  </div>
                ))}
              </code>
            </pre>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-[#44475a] text-xs" style={{ backgroundColor: '#21222c', color: '#6272a4' }}>
            <span>{lines.length} lines</span>
            <div className="flex items-center gap-4">
              {canRun && <span className="text-[#50fa7b]">Click "Run & Edit" to execute</span>}
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

  const hasRunnableFiles = files.some((f) => runnableLanguages.includes(f.language.toLowerCase()))

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
      <div className="rounded-xl overflow-hidden h-fit sticky top-8 border border-[#44475a]" style={{ backgroundColor: '#282a36' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#44475a]" style={{ backgroundColor: '#21222c' }}>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsOpen(!isOpen)} className="text-[#6272a4] hover:text-[#f8f8f2]">
              <ChevronRight size={16} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>
            <span className="text-sm font-medium text-[#f8f8f2]">Project Files</span>
          </div>
          <button onClick={downloadAll} className="text-xs text-[#6272a4] hover:text-[#f8f8f2] flex items-center gap-1">
            <Download size={12} />
            All
          </button>
        </div>

        {/* File list */}
        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="p-2">
                {files.map((file) => {
                  const langColor = languageColors[file.language] || '#6b7280'
                  return (
                    <button
                      key={file.name}
                      onClick={() => onSelectFile(file.name)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeFile === file.name ? 'bg-[#44475a] text-[#f8f8f2]' : 'text-[#6272a4] hover:bg-[#44475a]/50 hover:text-[#f8f8f2]'
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

              {hasRunnableFiles && files.length > 1 && (
                <div className="p-2 pt-0">
                  <button
                    onClick={() => setShowIDE(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#50fa7b] hover:bg-[#69ff94] text-[#282a36] text-sm font-bold rounded-lg transition-colors"
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

      {showIDE && <SandpackIDE files={files} onClose={() => setShowIDE(false)} />}
    </>
  )
}

export default CodeBlock
