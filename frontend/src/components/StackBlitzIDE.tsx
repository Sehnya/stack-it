import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import sdk, { Project } from '@stackblitz/sdk'
import { X, Maximize2, Minimize2, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'

interface FileItem {
  name: string
  language: string
  code: string
}

interface StackBlitzIDEProps {
  files: FileItem[]
  entryFile?: string
  onClose: () => void
  title?: string
}

// Map file extensions to StackBlitz-compatible paths
const getStackBlitzFiles = (files: FileItem[]): Record<string, string> => {
  const sbFiles: Record<string, string> = {}
  files.forEach((file) => {
    sbFiles[file.name] = file.code
  })
  return sbFiles
}

// Detect the best template for the project
const detectTemplate = (files: FileItem[]): Project['template'] => {
  const fileNames = files.map((f) => f.name.toLowerCase())
  
  // Check for specific frameworks/templates
  if (fileNames.some((f) => f.includes('vite.config'))) return 'node'
  if (fileNames.some((f) => f.includes('next.config'))) return 'node'
  if (fileNames.some((f) => f.includes('package.json'))) {
    const pkgFile = files.find((f) => f.name === 'package.json')
    if (pkgFile) {
      try {
        const pkg = JSON.parse(pkgFile.code)
        if (pkg.dependencies?.react || pkg.devDependencies?.react) return 'node'
        if (pkg.dependencies?.vue || pkg.devDependencies?.vue) return 'node'
        if (pkg.dependencies?.typescript || pkg.devDependencies?.typescript) return 'typescript'
      } catch {}
    }
    return 'node'
  }
  
  // Simple file type detection
  if (fileNames.some((f) => f.endsWith('.html'))) return 'html'
  if (fileNames.some((f) => f.endsWith('.ts') || f.endsWith('.tsx'))) return 'typescript'
  
  return 'javascript'
}

// Create a proper project structure based on template
const createProject = (files: FileItem[], title: string): Project => {
  const template = detectTemplate(files)
  const sbFiles = getStackBlitzFiles(files)
  
  // For javascript/typescript templates, ensure we have an index file
  if (template === 'javascript' || template === 'typescript') {
    const ext = template === 'typescript' ? 'ts' : 'js'
    if (!sbFiles[`index.${ext}`] && !sbFiles['index.js'] && !sbFiles['index.ts']) {
      // Find the main file and create an index that imports it
      const mainFile = files.find((f) => 
        f.name.endsWith('.js') || f.name.endsWith('.ts')
      )
      if (mainFile) {
        const importName = mainFile.name.replace(/\.(js|ts)$/, '')
        sbFiles[`index.${ext}`] = `// Entry point\nimport './${importName}';\n`
      }
    }
  }
  
  // For HTML template, ensure we have index.html
  if (template === 'html' && !sbFiles['index.html']) {
    const jsFiles = files.filter((f) => f.name.endsWith('.js'))
    const cssFiles = files.filter((f) => f.name.endsWith('.css'))
    
    sbFiles['index.html'] = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${cssFiles.map((f) => `<link rel="stylesheet" href="./${f.name}">`).join('\n  ')}
</head>
<body>
  <div id="app"></div>
  ${jsFiles.map((f) => `<script src="./${f.name}"></script>`).join('\n  ')}
</body>
</html>`
  }

  return {
    title: title || 'Stack-It Project',
    description: 'Code from Stack-It',
    template,
    files: sbFiles,
  }
}

export const StackBlitzIDE = ({ files: initialFiles, entryFile, onClose, title = 'Stack-It Project' }: StackBlitzIDEProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const embedRef = useRef<any>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || mountedRef.current) return
    mountedRef.current = true

    const initStackBlitz = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const project = createProject(initialFiles, title)

        // Find entry file to open
        let openFile = entryFile
        if (!openFile) {
          const entryNames = ['index.html', 'index.js', 'index.ts', 'main.js', 'main.ts', 'app.js']
          for (const name of entryNames) {
            if (project.files[name]) {
              openFile = name
              break
            }
          }
          if (!openFile) openFile = Object.keys(project.files)[0]
        }

        // Embed the project
        embedRef.current = await sdk.embedProject(
          containerRef.current!,
          project,
          {
            openFile,
            view: 'editor',
            hideExplorer: false,
            hideNavigation: false,
            hideDevTools: false,
            theme: 'dark',
            height: '100%',
          }
        )

        setIsLoading(false)
      } catch (err: any) {
        console.error('StackBlitz error:', err)
        setError(err.message || 'Failed to load StackBlitz IDE')
        setIsLoading(false)
      }
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initStackBlitz, 100)
    return () => clearTimeout(timer)
  }, [initialFiles, entryFile, title])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      embedRef.current = null
    }
  }, [])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, isFullscreen])

  // Open in new StackBlitz tab
  const openInNewTab = () => {
    const project = createProject(initialFiles, title)
    sdk.openProject(project, { newWindow: true })
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
        <div className="flex items-center justify-between h-10 px-3 bg-[#323233] border-b border-[#252526] select-none shrink-0">
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
            <span className="text-[10px] text-gray-500 ml-2">StackBlitz</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={openInNewTab}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Open in StackBlitz (full features)"
            >
              <ExternalLink size={12} />
              Open Full IDE
            </button>
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

        {/* StackBlitz Container */}
        <div className="flex-1 relative bg-[#1e1e1e] overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] z-10">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Loading StackBlitz...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] z-10">
              <div className="text-center max-w-md px-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                  <X size={24} className="text-red-400" />
                </div>
                <p className="text-red-400 font-medium mb-2">Failed to load IDE</p>
                <p className="text-gray-500 text-sm mb-4">{error}</p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={openInNewTab}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                  >
                    <ExternalLink size={14} />
                    Open in StackBlitz
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          <div
            ref={containerRef}
            className="w-full h-full"
          />
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}

export default StackBlitzIDE
