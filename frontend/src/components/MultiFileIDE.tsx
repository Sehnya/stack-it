import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Editor, { Monaco, OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
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
  ChevronDown,
  Folder,
  FolderOpen,
  Search,
  Settings,
  Maximize2,
  Minimize2,
  RotateCcw,
  FileJson,
  FileType,
  Braces,
  Hash,
  Code2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Circle,
  Square,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface FileItem {
  name: string
  language: string
  code: string
}

interface TreeNode {
  name: string
  path: string
  isFolder: boolean
  children: TreeNode[]
  file?: FileItem
}

interface OutputLine {
  type: 'log' | 'error' | 'warn' | 'info' | 'system' | 'success' | 'time' | 'lint'
  content: string
  timestamp?: number
  file?: string
  line?: number
  column?: number
}

interface LintIssue {
  type: 'error' | 'warning'
  message: string
  file: string
  line: number
  column: number
  rule: string
}

// Simple JavaScript linter
const lintCode = (code: string, fileName: string): LintIssue[] => {
  const issues: LintIssue[] = []
  const lines = code.split('\n')

  lines.forEach((line, lineIndex) => {
    const lineNum = lineIndex + 1
    const trimmed = line.trim()

    // Skip console.log check - it's expected in demo/learning code
    // Uncomment to enable: no-console rule
    // const consoleMatch = line.match(/console\.(log|debug)\s*\(/)
    // if (consoleMatch) { ... }

    // Check for var usage (warning - prefer const/let)
    const varMatch = line.match(/\bvar\s+\w/)
    if (varMatch && !trimmed.startsWith('//') && !trimmed.startsWith('*')) {
      issues.push({
        type: 'warning',
        message: `Unexpected var, use let or const instead`,
        file: fileName,
        line: lineNum,
        column: line.indexOf('var') + 1,
        rule: 'no-var',
      })
    }

    // Check for == instead of === (warning)
    const eqMatch = line.match(/[^=!<>]==[^=]/)
    if (eqMatch && !trimmed.startsWith('//') && !trimmed.startsWith('*')) {
      issues.push({
        type: 'warning',
        message: `Expected '===' and instead saw '=='`,
        file: fileName,
        line: lineNum,
        column: line.indexOf('==') + 1,
        rule: 'eqeqeq',
      })
    }

    // Check for != instead of !== (warning)
    const neqMatch = line.match(/!=[^=]/)
    if (neqMatch && !trimmed.startsWith('//') && !trimmed.startsWith('*')) {
      issues.push({
        type: 'warning',
        message: `Expected '!==' and instead saw '!='`,
        file: fileName,
        line: lineNum,
        column: line.indexOf('!=') + 1,
        rule: 'eqeqeq',
      })
    }

    // Check for debugger statement (error)
    if (/\bdebugger\b/.test(line) && !trimmed.startsWith('//')) {
      issues.push({
        type: 'error',
        message: `Unexpected 'debugger' statement`,
        file: fileName,
        line: lineNum,
        column: line.indexOf('debugger') + 1,
        rule: 'no-debugger',
      })
    }

    // Check for alert/confirm/prompt (warning)
    const alertMatch = line.match(/\b(alert|confirm|prompt)\s*\(/)
    if (alertMatch && !trimmed.startsWith('//')) {
      issues.push({
        type: 'warning',
        message: `Unexpected ${alertMatch[1]}`,
        file: fileName,
        line: lineNum,
        column: line.indexOf(alertMatch[1]) + 1,
        rule: 'no-alert',
      })
    }

    // Check for empty blocks (warning)
    if (/\{\s*\}/.test(line) && !trimmed.startsWith('//') && !line.includes('=>')) {
      issues.push({
        type: 'warning',
        message: `Empty block statement`,
        file: fileName,
        line: lineNum,
        column: line.indexOf('{') + 1,
        rule: 'no-empty',
      })
    }

    // Check for trailing whitespace (info - skip)
    // Check for missing semicolons - basic check
    if (
      trimmed.length > 0 &&
      !trimmed.startsWith('//') &&
      !trimmed.startsWith('*') &&
      !trimmed.startsWith('/*') &&
      !trimmed.endsWith('{') &&
      !trimmed.endsWith('}') &&
      !trimmed.endsWith(',') &&
      !trimmed.endsWith(';') &&
      !trimmed.endsWith(':') &&
      !trimmed.endsWith('(') &&
      !trimmed.endsWith(')') &&
      !trimmed.endsWith('[') &&
      !trimmed.endsWith(']') &&
      !trimmed.endsWith('`') &&
      !trimmed.endsWith("'") &&
      !trimmed.endsWith('"') &&
      !trimmed.endsWith('=>') &&
      !trimmed.endsWith('&&') &&
      !trimmed.endsWith('||') &&
      !trimmed.endsWith('+') &&
      !trimmed.endsWith('-') &&
      !trimmed.endsWith('?') &&
      !/^(if|else|for|while|do|switch|try|catch|finally|class|function|import|export|return|const|let|var)\b/.test(trimmed) &&
      !/^\}?\s*(else|catch|finally)/.test(trimmed)
    ) {
      // This is a very basic check and will have false positives
      // Skip for now to avoid noise
    }

    // Check for unused variables - basic pattern (would need AST for real check)
    // Skip - too complex without proper parsing

    // Check for potential infinite loops
    if (/while\s*\(\s*true\s*\)/.test(line) || /for\s*\(\s*;\s*;\s*\)/.test(line)) {
      issues.push({
        type: 'warning',
        message: `Potential infinite loop`,
        file: fileName,
        line: lineNum,
        column: 1,
        rule: 'no-infinite-loop',
      })
    }

    // Check for TODO/FIXME comments (info)
    const todoMatch = line.match(/\/\/\s*(TODO|FIXME|HACK|XXX):/i)
    if (todoMatch) {
      issues.push({
        type: 'warning',
        message: `Found ${todoMatch[1].toUpperCase()} comment`,
        file: fileName,
        line: lineNum,
        column: line.indexOf(todoMatch[1]) + 1,
        rule: 'no-warning-comments',
      })
    }
  })

  // Skip syntax checking with Function constructor as it doesn't support ES6 class syntax
  // Runtime errors will be caught during execution instead
  // Basic bracket matching check
  let braceCount = 0
  let parenCount = 0
  let bracketCount = 0
  let inString = false
  let stringChar = ''
  let inComment = false
  let inMultiComment = false

  for (let i = 0; i < code.length; i++) {
    const char = code[i]
    const nextChar = code[i + 1]
    const prevChar = code[i - 1]

    // Handle comments
    if (!inString && !inMultiComment && char === '/' && nextChar === '/') {
      inComment = true
      continue
    }
    if (!inString && !inComment && char === '/' && nextChar === '*') {
      inMultiComment = true
      continue
    }
    if (inMultiComment && char === '*' && nextChar === '/') {
      inMultiComment = false
      i++
      continue
    }
    if (inComment && char === '\n') {
      inComment = false
      continue
    }
    if (inComment || inMultiComment) continue

    // Handle strings
    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      if (!inString) {
        inString = true
        stringChar = char
      } else if (char === stringChar) {
        inString = false
      }
      continue
    }
    if (inString) continue

    // Count brackets
    if (char === '{') braceCount++
    if (char === '}') braceCount--
    if (char === '(') parenCount++
    if (char === ')') parenCount--
    if (char === '[') bracketCount++
    if (char === ']') bracketCount--
  }

  if (braceCount !== 0) {
    issues.push({
      type: 'error',
      message: braceCount > 0 ? `Missing closing brace '}'` : `Unexpected closing brace '}'`,
      file: fileName,
      line: 1,
      column: 1,
      rule: 'syntax-error',
    })
  }
  if (parenCount !== 0) {
    issues.push({
      type: 'error',
      message: parenCount > 0 ? `Missing closing parenthesis ')'` : `Unexpected closing parenthesis ')'`,
      file: fileName,
      line: 1,
      column: 1,
      rule: 'syntax-error',
    })
  }
  if (bracketCount !== 0) {
    issues.push({
      type: 'error',
      message: bracketCount > 0 ? `Missing closing bracket ']'` : `Unexpected closing bracket ']'`,
      file: fileName,
      line: 1,
      column: 1,
      rule: 'syntax-error',
    })
  }

  return issues
}


interface MultiFileIDEProps {
  files: FileItem[]
  entryFile?: string
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
  md: 'markdown',
  markdown: 'markdown',
}

const getFileIcon = (lang: string) => {
  const l = lang.toLowerCase()
  if (['javascript', 'js', 'jsx'].includes(l)) return <FileJson size={14} className="text-yellow-400" />
  if (['typescript', 'ts', 'tsx'].includes(l)) return <FileType size={14} className="text-blue-400" />
  if (['json'].includes(l)) return <Braces size={14} className="text-yellow-300" />
  if (['html'].includes(l)) return <Code2 size={14} className="text-orange-400" />
  if (['css'].includes(l)) return <Hash size={14} className="text-blue-300" />
  if (['python', 'py'].includes(l)) return <FileCode size={14} className="text-green-400" />
  return <FileCode size={14} className="text-gray-400" />
}

const runnableLanguages = ['javascript', 'typescript', 'js', 'ts', 'jsx', 'tsx']

const buildFileTree = (files: FileItem[]): TreeNode[] => {
  const root: TreeNode[] = []
  files.forEach((file) => {
    const parts = file.name.split('/')
    let currentLevel = root
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1
      const path = parts.slice(0, index + 1).join('/')
      let existing = currentLevel.find((n) => n.name === part)
      if (!existing) {
        existing = { name: part, path, isFolder: !isLast, children: [], file: isLast ? file : undefined }
        currentLevel.push(existing)
      }
      if (!isLast) currentLevel = existing.children
    })
  })
  const sortNodes = (nodes: TreeNode[]): TreeNode[] =>
    nodes
      .sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1
        if (!a.isFolder && b.isFolder) return 1
        return a.name.localeCompare(b.name)
      })
      .map((n) => ({ ...n, children: sortNodes(n.children) }))
  return sortNodes(root)
}

const FileTreeNode = ({
  node,
  depth,
  activeFile,
  expandedFolders,
  onToggleFolder,
  onOpenFile,
}: {
  node: TreeNode
  depth: number
  activeFile: string
  expandedFolders: Set<string>
  onToggleFolder: (path: string) => void
  onOpenFile: (name: string) => void
}) => {
  const isExpanded = expandedFolders.has(node.path)

  if (node.isFolder) {
    return (
      <div>
        <button
          onClick={() => onToggleFolder(node.path)}
          className="w-full flex items-center gap-1.5 py-[3px] text-left text-[13px] text-gray-400 hover:bg-[#2a2d2e] hover:text-gray-200 transition-colors group"
          style={{ paddingLeft: `${depth * 8 + 8}px` }}
        >
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {isExpanded ? <FolderOpen size={14} className="text-amber-400" /> : <Folder size={14} className="text-amber-400" />}
          <span className="truncate">{node.name}</span>
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}>
              {node.children.map((child) => (
                <FileTreeNode key={child.path} node={child} depth={depth + 1} activeFile={activeFile} expandedFolders={expandedFolders} onToggleFolder={onToggleFolder} onOpenFile={onOpenFile} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <button
      onClick={() => onOpenFile(node.path)}
      className={`w-full flex items-center gap-1.5 py-[3px] text-left text-[13px] transition-colors ${activeFile === node.path ? 'bg-[#094771] text-white' : 'text-gray-400 hover:bg-[#2a2d2e] hover:text-gray-200'}`}
      style={{ paddingLeft: `${depth * 8 + 22}px` }}
    >
      {node.file && getFileIcon(node.file.language)}
      <span className="truncate">{node.name}</span>
    </button>
  )
}


// Terminal Output Component with rich formatting
const TerminalOutput = ({ lines }: { lines: OutputLine[] }) => {
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [lines])

  const getIcon = (type: OutputLine['type']) => {
    switch (type) {
      case 'error': return <XCircle size={12} className="text-red-400 flex-shrink-0" />
      case 'warn': return <AlertTriangle size={12} className="text-yellow-400 flex-shrink-0" />
      case 'info': return <Circle size={12} className="text-blue-400 flex-shrink-0" />
      case 'success': return <CheckCircle2 size={12} className="text-green-400 flex-shrink-0" />
      case 'time': return <Clock size={12} className="text-gray-500 flex-shrink-0" />
      case 'system': return <Terminal size={12} className="text-cyan-400 flex-shrink-0" />
      case 'lint': return <AlertTriangle size={12} className="text-orange-400 flex-shrink-0" />
      default: return null
    }
  }

  const getClass = (type: OutputLine['type']) => {
    switch (type) {
      case 'error': return 'text-red-400 bg-red-500/5'
      case 'warn': return 'text-yellow-400 bg-yellow-500/5'
      case 'info': return 'text-blue-400'
      case 'success': return 'text-green-400'
      case 'time': return 'text-gray-500 italic'
      case 'system': return 'text-cyan-400'
      case 'lint': return 'text-orange-400 bg-orange-500/5'
      default: return 'text-gray-300'
    }
  }

  return (
    <div ref={outputRef} className="flex-1 overflow-auto font-mono text-xs leading-relaxed">
      {lines.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-600">
          <div className="text-center">
            <Terminal size={32} className="mx-auto mb-2 opacity-50" />
            <p>No output yet</p>
            <p className="text-[10px] mt-1">Click Run to execute your code</p>
          </div>
        </div>
      ) : (
        <div className="p-3 space-y-0.5">
          {lines.map((line, i) => (
            <div key={i} className={`flex items-start gap-2 py-0.5 px-2 rounded ${getClass(line.type)}`}>
              {getIcon(line.type)}
              <div className="flex-1">
                <pre className="whitespace-pre-wrap break-all">{line.content}</pre>
                {line.file && line.line && (
                  <span className="text-[10px] text-gray-500 ml-2">
                    {line.file}:{line.line}{line.column ? `:${line.column}` : ''}
                  </span>
                )}
              </div>
              {line.timestamp && (
                <span className="text-[10px] text-gray-600 flex-shrink-0">{line.timestamp}ms</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const MultiFileIDE = ({ files: initialFiles, entryFile, onClose }: MultiFileIDEProps) => {
  const [files, setFiles] = useState<FileItem[]>(initialFiles)
  const [activeFile, setActiveFile] = useState(entryFile || initialFiles[0]?.name || '')
  const [openTabs, setOpenTabs] = useState<string[]>([entryFile || initialFiles[0]?.name || ''])
  const [output, setOutput] = useState<OutputLine[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showOutput, setShowOutput] = useState(false)
  const [showExplorer, setShowExplorer] = useState(true)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 })
  const [executionTime, setExecutionTime] = useState<number | null>(null)
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
  const [lintIssues, setLintIssues] = useState<LintIssue[]>([])
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)

  const fileTree = useMemo(() => buildFileTree(files), [files])
  const currentFile = files.find((f) => f.name === activeFile)
  const monacoLang = currentFile ? languageToMonaco[currentFile.language.toLowerCase()] || 'plaintext' : 'plaintext'
  const hasRunnableFiles = files.some((f) => runnableLanguages.includes(f.language.toLowerCase()))

  useEffect(() => {
    const folders = new Set<string>()
    files.forEach((file) => {
      const parts = file.name.split('/')
      for (let i = 1; i < parts.length; i++) folders.add(parts.slice(0, i).join('/'))
    })
    setExpandedFolders(folders)
  }, [])

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }

  const findEntryPoint = (): string => {
    const entryNames = ['index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts', 'server.js', 'server.ts']
    for (const name of entryNames) {
      const found = files.find((f) => f.name === name || f.name.toLowerCase() === name)
      if (found) return found.name
    }
    for (const name of entryNames) {
      const found = files.find((f) => f.name.endsWith('/' + name))
      if (found) return found.name
    }
    return files.find((f) => runnableLanguages.includes(f.language.toLowerCase()))?.name || files[0]?.name || ''
  }

  const openFile = (name: string) => {
    setActiveFile(name)
    if (!openTabs.includes(name)) setOpenTabs((prev) => [...prev, name])
  }

  const closeTab = (name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newTabs = openTabs.filter((t) => t !== name)
    setOpenTabs(newTabs)
    if (activeFile === name && newTabs.length > 0) setActiveFile(newTabs[newTabs.length - 1])
  }

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({ line: e.position.lineNumber, column: e.position.column })
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {})
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, () => setShowSearch(true))
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => setShowExplorer((prev) => !prev))
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runProject())

    monaco.editor.defineTheme('stack-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#c6c6c6',
        'editor.selectionBackground': '#264f78',
        'editor.lineHighlightBackground': '#2a2d2e',
        'editorCursor.foreground': '#aeafad',
      },
    })
    monaco.editor.setTheme('stack-dark')
  }

  const updateFileCode = useCallback((code: string | undefined) => {
    if (code === undefined) return
    setFiles((prev) => prev.map((f) => (f.name === activeFile ? { ...f, code } : f)))
  }, [activeFile])


  const runProject = async () => {
    if (!hasRunnableFiles || isRunning) return
    
    setIsRunning(true)
    setShowOutput(true)
    setExecutionStatus('running')
    setExecutionTime(null)
    
    const startTime = performance.now()
    const logs: OutputLine[] = []
    
    const addLog = (type: OutputLine['type'], content: string, timestamp?: number, file?: string, line?: number, column?: number) => {
      logs.push({ type, content, timestamp, file, line, column })
    }

    const entry = findEntryPoint()
    addLog('system', `$ node ${entry}`)
    
    // Run linting first
    addLog('system', `Linting files...`)
    const allIssues: LintIssue[] = []
    files.forEach((file) => {
      if (runnableLanguages.includes(file.language.toLowerCase())) {
        const issues = lintCode(file.code, file.name)
        allIssues.push(...issues)
      }
    })
    setLintIssues(allIssues)

    const errors = allIssues.filter(i => i.type === 'error')
    const warnings = allIssues.filter(i => i.type === 'warning')

    if (allIssues.length > 0) {
      addLog('system', `Found ${errors.length} error(s), ${warnings.length} warning(s)`)
      
      // Show lint issues
      allIssues.forEach((issue) => {
        addLog(
          issue.type === 'error' ? 'error' : 'warn',
          `[${issue.rule}] ${issue.message}`,
          undefined,
          issue.file,
          issue.line,
          issue.column
        )
      })

      // If there are syntax errors, don't run
      if (errors.some(e => e.rule === 'syntax-error')) {
        addLog('error', `Cannot run: syntax errors found`)
        setExecutionStatus('error')
        setIsRunning(false)
        setOutput([...logs])
        return
      }
      
      addLog('system', ``)
    } else {
      addLog('success', `No lint issues found`)
    }

    addLog('system', `Building modules...`)

    // Small delay to show building state
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      const modules: Record<string, string> = {}
      const moduleCache: Record<string, any> = {}
      const timers: Record<string, number> = {}

      const resolvePath = (fromDir: string, importPath: string): string => {
        let path = importPath.replace(/\.(js|ts|jsx|tsx)$/, '')
        if (path.startsWith('./')) {
          path = path.substring(2)
          return fromDir ? `${fromDir}/${path}` : path
        } else if (path.startsWith('../')) {
          const parts = fromDir.split('/').filter(Boolean)
          const importParts = path.split('/')
          for (const part of importParts) {
            if (part === '..') parts.pop()
            else if (part !== '.') parts.push(part)
          }
          return parts.join('/')
        }
        return path
      }

      const formatValue = (value: any, depth = 0): string => {
        if (depth > 3) return '[Object]'
        if (value === undefined) return 'undefined'
        if (value === null) return 'null'
        if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`
        if (typeof value === 'symbol') return value.toString()
        if (Array.isArray(value)) {
          if (value.length === 0) return '[]'
          if (value.length > 10) return `[Array(${value.length})]`
          return `[ ${value.map(v => formatValue(v, depth + 1)).join(', ')} ]`
        }
        if (typeof value === 'object') {
          const keys = Object.keys(value)
          if (keys.length === 0) return '{}'
          if (keys.length > 5) return `{${keys.slice(0, 3).map(k => `${k}: ...`).join(', ')}, ...}`
          try {
            return JSON.stringify(value, null, 2)
          } catch {
            return '[Circular]'
          }
        }
        if (typeof value === 'string') return value
        return String(value)
      }

      const customConsole = {
        log: (...args: any[]) => addLog('log', args.map(a => formatValue(a)).join(' ')),
        error: (...args: any[]) => addLog('error', args.map(a => formatValue(a)).join(' ')),
        warn: (...args: any[]) => addLog('warn', args.map(a => formatValue(a)).join(' ')),
        info: (...args: any[]) => addLog('info', args.map(a => formatValue(a)).join(' ')),
        debug: (...args: any[]) => addLog('log', `[debug] ${args.map(a => formatValue(a)).join(' ')}`),
        table: (data: any) => {
          if (Array.isArray(data)) {
            addLog('log', '┌' + '─'.repeat(50) + '┐')
            data.forEach((row, i) => addLog('log', `│ ${i}: ${formatValue(row)}`))
            addLog('log', '└' + '─'.repeat(50) + '┘')
          } else {
            addLog('log', formatValue(data))
          }
        },
        clear: () => { logs.length = 0 },
        time: (label = 'default') => { timers[label] = performance.now() },
        timeEnd: (label = 'default') => {
          if (timers[label]) {
            const elapsed = (performance.now() - timers[label]).toFixed(2)
            addLog('time', `${label}: ${elapsed}ms`)
            delete timers[label]
          }
        },
        timeLog: (label = 'default') => {
          if (timers[label]) {
            const elapsed = (performance.now() - timers[label]).toFixed(2)
            addLog('time', `${label}: ${elapsed}ms`)
          }
        },
        count: (() => {
          const counts: Record<string, number> = {}
          return (label = 'default') => {
            counts[label] = (counts[label] || 0) + 1
            addLog('log', `${label}: ${counts[label]}`)
          }
        })(),
        group: (label?: string) => addLog('log', `▼ ${label || 'group'}`),
        groupEnd: () => {},
        assert: (condition: boolean, ...args: any[]) => {
          if (!condition) addLog('error', `Assertion failed: ${args.map(a => formatValue(a)).join(' ')}`)
        },
        dir: (obj: any) => addLog('log', formatValue(obj)),
        trace: () => addLog('log', 'Trace: (stack trace not available in sandbox)'),
      }

      // Transform and compile modules
      files.forEach((file) => {
        if (!runnableLanguages.includes(file.language.toLowerCase())) return
        let code = file.code
        const exportedNames: string[] = []
        const fileDir = file.name.includes('/') ? file.name.substring(0, file.name.lastIndexOf('/')) : ''

        // Handle imports
        code = code.replace(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g, (_, imports, path) => {
          return `const {${imports}} = require('${resolvePath(fileDir, path)}')`
        })
        code = code.replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g, (_, name, path) => {
          const resolved = resolvePath(fileDir, path)
          return `const ${name} = require('${resolved}').default || require('${resolved}')`
        })
        code = code.replace(/import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g, (_, name, path) => {
          return `const ${name} = require('${resolvePath(fileDir, path)}')`
        })

        // Handle exports
        code = code.replace(/export\s+default\s+(class|function)\s+(\w+)/g, (_, type, name) => {
          exportedNames.push(`default:${name}`)
          return `${type} ${name}`
        })
        code = code.replace(/export\s+default\s+(\w+)\s*$/gm, (_, name) => {
          exportedNames.push(`default:${name}`)
          return ''
        })
        code = code.replace(/export\s+default\s+/g, 'module.exports.default = ')
        code = code.replace(/export\s+(function|class)\s+(\w+)/g, (_, type, name) => {
          exportedNames.push(name)
          return `${type} ${name}`
        })
        code = code.replace(/export\s+(const|let|var)\s+(\w+)\s*=/g, (_, type, name) => {
          exportedNames.push(name)
          return `${type} ${name} =`
        })
        code = code.replace(/export\s+\{([^}]+)\}/g, (_, exports) => {
          exports.split(',').map((n: string) => n.trim()).forEach((n: string) => {
            if (n.includes(' as ')) {
              const [orig, alias] = n.split(' as ').map(s => s.trim())
              exportedNames.push(`${alias}:${orig}`)
            } else {
              exportedNames.push(n)
            }
          })
          return ''
        })

        if (exportedNames.length > 0) {
          const exportStatements = exportedNames.map((name) => {
            if (name.startsWith('default:')) return `module.exports.default = ${name.replace('default:', '')}`
            if (name.includes(':')) {
              const [alias, orig] = name.split(':')
              return `module.exports.${alias} = ${orig}`
            }
            return `module.exports.${name} = ${name}`
          })
          code = code + '\n' + exportStatements.join(';\n')
        }

        const fullPath = file.name.replace(/\.(js|ts|jsx|tsx)$/, '')
        modules[fullPath] = code
        const fileName = file.name.split('/').pop()?.replace(/\.(js|ts|jsx|tsx)$/, '') || ''
        if (fileName && !modules[fileName]) modules[fileName] = code
      })

      // Parse error to extract line/column info
      const parseError = (error: any): { message: string; line?: number; column?: number } => {
        const stack = error.stack || ''
        const message = error.message || String(error)
        
        // Try to extract line number from various error formats
        // Format: "at eval (eval at <anonymous>..., <anonymous>:LINE:COL)"
        let lineMatch = stack.match(/<anonymous>:(\d+):(\d+)/)
        if (lineMatch) {
          // Subtract 2 for the IIFE wrapper lines we added
          const line = Math.max(1, parseInt(lineMatch[1]) - 2)
          const column = parseInt(lineMatch[2])
          return { message, line, column }
        }
        
        // Format: "SyntaxError: ... (LINE:COL)"
        lineMatch = message.match(/\((\d+):(\d+)\)/)
        if (lineMatch) {
          return { message: message.replace(/\(\d+:\d+\)/, '').trim(), line: parseInt(lineMatch[1]), column: parseInt(lineMatch[2]) }
        }
        
        // Format: "at line LINE"
        lineMatch = message.match(/at line (\d+)/)
        if (lineMatch) {
          return { message: message.replace(/at line \d+/, '').trim(), line: parseInt(lineMatch[1]) }
        }
        
        // Format: "Line LINE:"
        lineMatch = message.match(/[Ll]ine (\d+)/)
        if (lineMatch) {
          return { message, line: parseInt(lineMatch[1]) }
        }

        return { message }
      }

      // Format error with code context
      const formatErrorWithContext = (error: any, moduleName: string, code: string) => {
        const codeLines = code.split('\n')
        const parsed = parseError(error)
        
        let output = `${error.name || 'Error'}: ${parsed.message}`
        
        if (parsed.line) {
          const lineNum = parsed.line
          const colNum = parsed.column || 1
          
          // Add location
          output += `\n    at ${moduleName}:${lineNum}:${colNum}`
          
          // Show code context (3 lines around error)
          const startLine = Math.max(0, lineNum - 2)
          const endLine = Math.min(codeLines.length, lineNum + 1)
          
          output += '\n\n'
          for (let i = startLine; i < endLine; i++) {
            const lineNumber = i + 1
            const isErrorLine = lineNumber === lineNum
            const prefix = isErrorLine ? ' > ' : '   '
            const lineStr = String(lineNumber).padStart(3, ' ')
            output += `${prefix}${lineStr} | ${codeLines[i]}\n`
            
            // Add caret pointing to column
            if (isErrorLine && colNum > 0) {
              const caretPadding = ' '.repeat(colNum + 7)
              output += `${caretPadding}^\n`
            }
          }
        }
        
        return output
      }

      const executeModule = (code: string, moduleName: string, moduleObj: { exports: any }, requireFn: any) => {
        try {
          // Use an iframe sandbox for proper ES6 class support
          const iframe = document.createElement('iframe')
          iframe.style.display = 'none'
          document.body.appendChild(iframe)
          
          const iframeWindow = iframe.contentWindow as any
          
          // Set up the sandbox environment in the iframe
          iframeWindow.module = moduleObj
          iframeWindow.exports = moduleObj.exports
          iframeWindow.require = requireFn
          iframeWindow.console = customConsole
          iframeWindow.setTimeout = setTimeout
          iframeWindow.setInterval = setInterval
          iframeWindow.clearTimeout = clearTimeout
          iframeWindow.clearInterval = clearInterval
          iframeWindow.Promise = Promise
          
          // Execute the code in the iframe context (supports ES6 classes)
          const script = iframeWindow.document.createElement('script')
          script.textContent = code
          
          // Catch any errors during script execution
          let scriptError: Error | null = null
          iframeWindow.onerror = (msg: string, _url: string, line: number, col: number, error: Error) => {
            scriptError = error || new Error(msg)
            ;(scriptError as any).line = line
            ;(scriptError as any).column = col
            return true
          }
          
          iframeWindow.document.body.appendChild(script)
          
          // Copy exports back
          moduleObj.exports = iframeWindow.module.exports
          
          // Clean up
          document.body.removeChild(iframe)
          
          if (scriptError) {
            throw scriptError
          }
        } catch (e: any) {
          const formattedError = formatErrorWithContext(e, moduleName, code)
          addLog('error', formattedError)
          throw e
        }
      }

      const createRequire = (): ((moduleName: string) => any) => {
        return (moduleName: string) => {
          const cleanName = moduleName.replace(/^\.\//, '').replace(/\.(js|ts|jsx|tsx)$/, '')
          if (moduleCache[cleanName]) return moduleCache[cleanName]
          const moduleCode = modules[cleanName]
          if (!moduleCode) {
            addLog('error', `Module not found: ${moduleName}`)
            throw new Error(`Module not found: ${moduleName}`)
          }
          const moduleObj: { exports: any } = { exports: {} }
          moduleCache[cleanName] = moduleObj.exports
          executeModule(moduleCode, cleanName, moduleObj, createRequire())
          moduleCache[cleanName] = moduleObj.exports
          return moduleCache[cleanName]
        }
      }

      addLog('system', `Executing ${entry}...`)
      setOutput([...logs])

      const entryCode = modules[entry.replace(/\.(js|ts|jsx|tsx)$/, '')]
      if (entryCode) {
        const moduleObj: { exports: any } = { exports: {} }
        executeModule(entryCode, entry, moduleObj, createRequire())
        
        const elapsed = Math.round(performance.now() - startTime)
        setExecutionTime(elapsed)
        addLog('success', `✓ Execution completed`)
        addLog('time', `Total time: ${elapsed}ms`, elapsed)
        setExecutionStatus('success')
      } else {
        addLog('error', `Entry point not found: ${entry}`)
        setExecutionStatus('error')
      }

      setOutput([...logs])
    } catch (error: any) {
      const elapsed = Math.round(performance.now() - startTime)
      setExecutionTime(elapsed)
      setExecutionStatus('error')
      addLog('error', `Execution failed: ${error.message}`)
      setOutput([...logs])
    }

    setIsRunning(false)
  }

  const stopExecution = () => {
    setIsRunning(false)
    setExecutionStatus('idle')
    setOutput(prev => [...prev, { type: 'warn', content: 'Execution stopped by user' }])
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
      a.download = file.name.split('/').pop() || file.name
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  const formatCode = () => {
    editorRef.current?.getAction('editor.action.formatDocument')?.run()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSearch) setShowSearch(false)
        else if (isFullscreen) setIsFullscreen(false)
        else onClose()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault()
        setShowSearch(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        runProject()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, showSearch, isFullscreen])

  const filteredFiles = searchQuery ? files.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase())) : []
  const breadcrumbs = activeFile.split('/').filter(Boolean)


  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className={`relative flex flex-col overflow-hidden bg-[#181818] shadow-2xl border border-[#333] ${isFullscreen ? 'w-full h-full' : 'w-[95vw] max-w-7xl h-[92vh] rounded-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between h-9 px-3 bg-[#323233] border-b border-[#252526] select-none">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <button onClick={onClose} className="w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff5f57]/80 transition-colors" />
              <button onClick={() => setIsFullscreen(false)} className="w-3 h-3 rounded-full bg-[#febc2e] hover:bg-[#febc2e]/80 transition-colors" />
              <button onClick={() => setIsFullscreen(true)} className="w-3 h-3 rounded-full bg-[#28c840] hover:bg-[#28c840]/80 transition-colors" />
            </div>
            <span className="text-xs text-gray-400 ml-2 font-medium">Stack IDE</span>
            {executionStatus !== 'idle' && (
              <div className={`flex items-center gap-1.5 ml-3 px-2 py-0.5 rounded text-[10px] font-medium ${
                executionStatus === 'running' ? 'bg-blue-500/20 text-blue-400' :
                executionStatus === 'success' ? 'bg-green-500/20 text-green-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {executionStatus === 'running' && <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
                {executionStatus === 'success' && <CheckCircle2 size={10} />}
                {executionStatus === 'error' && <XCircle size={10} />}
                {executionStatus === 'running' ? 'Running...' : executionStatus === 'success' ? `Done (${executionTime}ms)` : 'Failed'}
              </div>
            )}
            {lintIssues.length > 0 && executionStatus === 'idle' && (
              <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded text-[10px] font-medium bg-orange-500/20 text-orange-400">
                <AlertTriangle size={10} />
                {lintIssues.filter(i => i.type === 'error').length} errors, {lintIssues.filter(i => i.type === 'warning').length} warnings
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {hasRunnableFiles && (
              isRunning ? (
                <button onClick={stopExecution} className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded transition-colors">
                  <Square size={10} fill="white" />
                  Stop
                </button>
              ) : (
                <button onClick={runProject} className="flex items-center gap-1.5 px-3 py-1 bg-[#28a745] hover:bg-[#2ea44f] text-white text-xs font-medium rounded transition-colors">
                  <Play size={12} fill="white" />
                  Run
                </button>
              )
            )}
            <button onClick={() => setShowSearch(true)} className="p-1.5 hover:bg-white/10 rounded transition-colors" title="Quick Open (⌘P)">
              <Search size={14} className="text-gray-400" />
            </button>
            <button onClick={formatCode} className="p-1.5 hover:bg-white/10 rounded transition-colors" title="Format">
              <Settings size={14} className="text-gray-400" />
            </button>
            <button onClick={handleCopy} className="p-1.5 hover:bg-white/10 rounded transition-colors" title="Copy">
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-400" />}
            </button>
            <button onClick={downloadAll} className="p-1.5 hover:bg-white/10 rounded transition-colors" title="Download All">
              <Download size={14} className="text-gray-400" />
            </button>
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 hover:bg-white/10 rounded transition-colors" title="Toggle Fullscreen">
              {isFullscreen ? <Minimize2 size={14} className="text-gray-400" /> : <Maximize2 size={14} className="text-gray-400" />}
            </button>
          </div>
        </div>

        {/* Quick Open Modal */}
        <AnimatePresence>
          {showSearch && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-12 left-1/2 -translate-x-1/2 w-[500px] bg-[#252526] rounded-lg shadow-2xl border border-[#454545] z-50 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[#454545]">
                <Search size={14} className="text-gray-400" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search files by name..." className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none" autoFocus />
                <kbd className="px-1.5 py-0.5 text-[10px] bg-[#333] text-gray-400 rounded">ESC</kbd>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredFiles.length > 0 ? (
                  filteredFiles.map((file) => (
                    <button key={file.name} onClick={() => { openFile(file.name); setShowSearch(false); setSearchQuery('') }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#094771] transition-colors">
                      {getFileIcon(file.language)}
                      <span className="text-sm text-gray-300">{file.name}</span>
                    </button>
                  ))
                ) : searchQuery ? (
                  <div className="px-3 py-4 text-sm text-gray-500 text-center">No files found</div>
                ) : (
                  <div className="px-3 py-4 text-sm text-gray-500 text-center">Type to search files...</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Activity Bar */}
          <div className="w-12 bg-[#252526] border-r border-[#1e1e1e] flex flex-col items-center py-2 gap-1">
            <button onClick={() => setShowExplorer(!showExplorer)} className={`p-2.5 rounded transition-colors ${showExplorer ? 'text-white bg-[#37373d]' : 'text-gray-500 hover:text-gray-300'}`} title="Explorer (⌘B)">
              <FileCode size={20} />
            </button>
            <button onClick={() => setShowSearch(true)} className="p-2.5 text-gray-500 hover:text-gray-300 rounded transition-colors" title="Search (⌘P)">
              <Search size={20} />
            </button>
            <div className="flex-1" />
            <button onClick={() => setShowOutput(!showOutput)} className={`p-2.5 rounded transition-colors relative ${showOutput ? 'text-white bg-[#37373d]' : 'text-gray-500 hover:text-gray-300'}`} title="Terminal (⌘Enter to run)">
              <Terminal size={20} />
              {executionStatus === 'error' && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />}
            </button>
          </div>

          {/* Sidebar */}
          <AnimatePresence>
            {showExplorer && (
              <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 240, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="bg-[#252526] border-r border-[#1e1e1e] overflow-hidden flex-shrink-0">
                <div className="h-full flex flex-col">
                  <div className="px-4 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Explorer</div>
                  <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    {fileTree.map((node) => (
                      <FileTreeNode key={node.path} node={node} depth={0} activeFile={activeFile} expandedFolders={expandedFolders} onToggleFolder={toggleFolder} onOpenFile={openFile} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Editor Area */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#1e1e1e]">
            {/* Tabs */}
            <div className="flex items-center bg-[#252526] overflow-x-auto scrollbar-none">
              {openTabs.map((tab) => {
                const file = files.find((f) => f.name === tab)
                const displayName = tab.split('/').pop() || tab
                return (
                  <div key={tab} onClick={() => setActiveFile(tab)} className={`group flex items-center gap-1.5 px-3 py-1.5 cursor-pointer border-r border-[#1e1e1e] min-w-0 ${activeFile === tab ? 'bg-[#1e1e1e] text-white' : 'bg-[#2d2d2d] text-gray-400 hover:text-gray-200'}`} title={tab}>
                    {file && getFileIcon(file.language)}
                    <span className="text-xs truncate max-w-[120px]">{displayName}</span>
                    <button onClick={(e) => closeTab(tab, e)} className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-opacity">
                      <X size={12} />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Breadcrumbs */}
            {breadcrumbs.length > 1 && (
              <div className="flex items-center gap-1 px-4 py-1 bg-[#1e1e1e] border-b border-[#333] text-xs text-gray-500">
                {breadcrumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight size={12} />}
                    <span className={i === breadcrumbs.length - 1 ? 'text-gray-300' : ''}>{crumb}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Monaco Editor */}
            <div className={`${showOutput ? 'h-[60%]' : 'flex-1'} overflow-hidden`}>
              {currentFile && (
                <Editor
                  height="100%"
                  language={monacoLang}
                  value={currentFile.code}
                  onChange={updateFileCode}
                  onMount={handleEditorMount}
                  theme="vs-dark"
                  options={{
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                    fontLigatures: true,
                    minimap: { enabled: true, scale: 1, showSlider: 'mouseover' },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: 'off',
                    lineNumbers: 'on',
                    renderLineHighlight: 'line',
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                    smoothScrolling: true,
                    padding: { top: 12, bottom: 12 },
                    bracketPairColorization: { enabled: true },
                    guides: { bracketPairs: true, indentation: true },
                    suggest: { showKeywords: true, showSnippets: true },
                    quickSuggestions: true,
                    parameterHints: { enabled: true },
                    folding: true,
                    foldingHighlight: true,
                    showFoldingControls: 'mouseover',
                    matchBrackets: 'always',
                    renderWhitespace: 'selection',
                    scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
                  }}
                />
              )}
            </div>

            {/* Terminal Panel */}
            <AnimatePresence>
              {showOutput && (
                <motion.div initial={{ height: 0 }} animate={{ height: '40%' }} exit={{ height: 0 }} className="border-t border-[#333] bg-[#1e1e1e] overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between px-4 py-1.5 bg-[#252526] border-b border-[#333]">
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-1.5 text-xs text-white">
                        <Terminal size={12} />
                        Terminal
                      </button>
                      {executionTime !== null && (
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Clock size={10} />
                          {executionTime}ms
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setOutput([])} className="p-1 hover:bg-white/10 rounded transition-colors" title="Clear">
                        <Trash2 size={12} className="text-gray-400" />
                      </button>
                      <button onClick={runProject} disabled={isRunning} className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50" title="Re-run (⌘Enter)">
                        <RotateCcw size={12} className="text-gray-400" />
                      </button>
                      <button onClick={() => setShowOutput(false)} className="p-1 hover:bg-white/10 rounded transition-colors" title="Close">
                        <X size={12} className="text-gray-400" />
                      </button>
                    </div>
                  </div>
                  <TerminalOutput lines={output} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between h-6 px-3 bg-[#007acc] text-white text-[11px]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><FileCode size={12} />{files.length} files</span>
            {hasRunnableFiles && <span className="flex items-center gap-1"><Play size={10} />Entry: {findEntryPoint().split('/').pop()}</span>}
            {executionStatus === 'running' && <span className="flex items-center gap-1 animate-pulse"><Circle size={8} fill="white" />Running</span>}
          </div>
          <div className="flex items-center gap-3">
            {currentFile && (
              <>
                <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
                <span>{monacoLang}</span>
                <span>UTF-8</span>
              </>
            )}
            <span className="opacity-60">⌘Enter to run</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default MultiFileIDE
