import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Typography from '@tiptap/extension-typography'
import { Extension } from '@tiptap/core'
import { common, createLowlight } from 'lowlight'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Code, Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Minus, Undo, Redo, AlignLeft, AlignCenter, AlignRight,
  AlignJustify, Link as LinkIcon, Image as ImageIcon, Highlighter,
  Subscript as SubIcon, Superscript as SuperIcon, CheckSquare,
  Table as TableIcon, Trash2, ArrowLeft, Save, Eye,
  Palette, FileCode, X, RowsIcon, ColumnsIcon, Upload, FileUp, File,
  ChevronDown, ChevronRight, Type, ALargeSmall, Folder, FolderOpen,
} from 'lucide-react'
import { TechVersionInput, techsToStrings } from '../components/TechVersionInput'
import { useAuth } from '../context/AuthContext'
import { getLanguageFromFilename } from '../lib/postStore'
import { api, PostFile } from '../lib/api'

type CodeFile = PostFile

// File tree node for nested folder display
interface FileTreeNode {
  name: string
  path: string
  isFolder: boolean
  children: FileTreeNode[]
  file?: CodeFile
}

// Build a tree structure from flat file list
const buildFileTree = (files: CodeFile[]): FileTreeNode[] => {
  const root: FileTreeNode[] = []
  
  files.forEach((file) => {
    const parts = file.name.split('/')
    let currentLevel = root
    
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1
      const path = parts.slice(0, index + 1).join('/')
      
      let existing = currentLevel.find((n) => n.name === part && n.isFolder === !isLast)
      
      if (!existing) {
        existing = {
          name: part,
          path,
          isFolder: !isLast,
          children: [],
          file: isLast ? file : undefined,
        }
        currentLevel.push(existing)
      }
      
      if (!isLast) {
        currentLevel = existing.children
      }
    })
  })
  
  // Sort: folders first, then alphabetically
  const sortNodes = (nodes: FileTreeNode[]): FileTreeNode[] =>
    nodes
      .sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1
        if (!a.isFolder && b.isFolder) return 1
        return a.name.localeCompare(b.name)
      })
      .map((n) => ({ ...n, children: sortNodes(n.children) }))
  
  return sortNodes(root)
}

// Recursive file tree node component
const FileTreeNodeComponent = ({
  node,
  depth,
  expandedFolders,
  onToggleFolder,
  onRemoveFile,
}: {
  node: FileTreeNode
  depth: number
  expandedFolders: Set<string>
  onToggleFolder: (path: string) => void
  onRemoveFile: (path: string) => void
}) => {
  const isExpanded = expandedFolders.has(node.path)
  const paddingLeft = depth * 12 + 8

  if (node.isFolder) {
    return (
      <div>
        <button
          onClick={() => onToggleFolder(node.path)}
          className="w-full flex items-center gap-1.5 py-1 text-left text-xs text-gray-400 hover:bg-[#252525] hover:text-gray-200 transition-colors rounded"
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {isExpanded ? <FolderOpen size={12} className="text-amber-400" /> : <Folder size={12} className="text-amber-400" />}
          <span className="truncate">{node.name}</span>
        </button>
        {isExpanded && (
          <div>
            {node.children.map((child) => (
              <FileTreeNodeComponent
                key={child.path}
                node={child}
                depth={depth + 1}
                expandedFolders={expandedFolders}
                onToggleFolder={onToggleFolder}
                onRemoveFile={onRemoveFile}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="flex items-center justify-between py-1 text-xs text-gray-300 hover:bg-[#252525] rounded group pr-2"
      style={{ paddingLeft: `${paddingLeft + 16}px` }}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <File size={12} className="text-gray-400 shrink-0" />
        <span className="truncate" title={node.path}>{node.name}</span>
      </div>
      <button
        onClick={() => onRemoveFile(node.path)}
        className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      >
        <X size={12} />
      </button>
    </div>
  )
}

const lowlight = createLowlight(common)

// Custom FontSize extension
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] }
  },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
          renderHTML: attributes => {
            if (!attributes.fontSize) return {}
            return { style: `font-size: ${attributes.fontSize}` }
          },
        },
      },
    }]
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run()
      },
    }
  },
})

// Font options
const fontFamilies = [
  { name: 'Default', value: '' },
  { name: 'Inter', value: 'Inter' },
  { name: 'Arial', value: 'Arial' },
  { name: 'Georgia', value: 'Georgia' },
  { name: 'Times New Roman', value: 'Times New Roman' },
  { name: 'Courier New', value: 'Courier New' },
  { name: 'Verdana', value: 'Verdana' },
  { name: 'Trebuchet MS', value: 'Trebuchet MS' },
  { name: 'Comic Sans MS', value: 'Comic Sans MS' },
]

const fontSizes = [
  { label: 'Default', value: '' },
  { label: '10px', value: '10px' },
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '20px', value: '20px' },
  { label: '24px', value: '24px' },
  { label: '28px', value: '28px' },
  { label: '32px', value: '32px' },
  { label: '36px', value: '36px' },
  { label: '48px', value: '48px' },
  { label: '64px', value: '64px' },
]

const MenuButton = ({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children
}: {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-lg transition-all ${
      isActive
        ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#333] hover:text-gray-900 dark:hover:text-gray-100'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
)

const Divider = () => <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

const CreatePost = () => {
  const navigate = useNavigate()
  useAuth() // Ensure user is authenticated
  const [title, setTitle] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [technologies, setTechnologies] = useState<{ name: string; version?: string }[]>([])
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([])
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [showImageModal, setShowImageModal] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showFontFamily, setShowFontFamily] = useState(false)
  const [showFontSize, setShowFontSize] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isFileDragging, setIsFileDragging] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const codeFileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const inlineImageInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCodeFileSelect = async (files: FileList | null) => {
    if (!files) return
    
    const newFiles: CodeFile[] = []
    const foldersToExpand = new Set<string>()
    
    for (const file of Array.from(files)) {
      // Use webkitRelativePath for folder uploads, fallback to name
      const relativePath = (file as any).webkitRelativePath || file.name
      // Remove the root folder name from the path for cleaner display
      const pathParts = relativePath.split('/')
      const cleanPath = pathParts.length > 1 ? pathParts.slice(1).join('/') : relativePath
      
      // Track folders to auto-expand
      const cleanParts = cleanPath.split('/')
      for (let i = 1; i < cleanParts.length; i++) {
        foldersToExpand.add(cleanParts.slice(0, i).join('/'))
      }
      
      const text = await file.text()
      newFiles.push({
        name: cleanPath,
        language: getLanguageFromFilename(file.name),
        code: text,
      })
    }
    setCodeFiles([...codeFiles, ...newFiles])
    setExpandedFolders(prev => new Set([...prev, ...foldersToExpand]))
  }

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    const newFiles: CodeFile[] = []
    const foldersToExpand = new Set<string>()
    
    for (const file of Array.from(files)) {
      // Skip hidden files and common non-code directories
      const relativePath = (file as any).webkitRelativePath || file.name
      if (relativePath.includes('/node_modules/') || 
          relativePath.includes('/.git/') ||
          relativePath.includes('/dist/') ||
          relativePath.includes('/build/') ||
          file.name.startsWith('.')) {
        continue
      }
      
      // Remove the root folder name from the path
      const pathParts = relativePath.split('/')
      const cleanPath = pathParts.length > 1 ? pathParts.slice(1).join('/') : relativePath
      
      // Track folders to auto-expand
      for (let i = 1; i < pathParts.length; i++) {
        foldersToExpand.add(pathParts.slice(1, i).join('/'))
      }
      
      const text = await file.text()
      newFiles.push({
        name: cleanPath,
        language: getLanguageFromFilename(file.name),
        code: text,
      })
    }
    
    setCodeFiles([...codeFiles, ...newFiles])
    setExpandedFolders(prev => new Set([...prev, ...foldersToExpand]))
    // Reset the input so the same folder can be selected again
    e.target.value = ''
  }

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const removeCodeFile = (name: string) => {
    setCodeFiles(codeFiles.filter(f => f.name !== name))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }

  const handleCodeFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsFileDragging(false)
    handleCodeFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer' } }),
      Image.configure({ 
        inline: false,
        allowBase64: true,
        HTMLAttributes: { class: 'rounded-lg max-w-full mx-auto my-4' } 
      }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder: 'Start writing your post...' }),
      CodeBlockLowlight.configure({ lowlight }),
      Typography,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-4',
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0]
          if (file.type.startsWith('image/')) {
            event.preventDefault()
            const reader = new FileReader()
            reader.onload = (e) => {
              const src = e.target?.result as string
              const { schema } = view.state
              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
              if (coordinates) {
                const node = schema.nodes.image.create({ src })
                const transaction = view.state.tr.insert(coordinates.pos, node)
                view.dispatch(transaction)
              }
            }
            reader.readAsDataURL(file)
            return true
          }
        }
        return false
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
              event.preventDefault()
              const file = item.getAsFile()
              if (file) {
                const reader = new FileReader()
                reader.onload = (e) => {
                  const src = e.target?.result as string
                  const { schema } = view.state
                  const node = schema.nodes.image.create({ src })
                  const transaction = view.state.tr.replaceSelectionWith(node)
                  view.dispatch(transaction)
                }
                reader.readAsDataURL(file)
              }
              return true
            }
          }
        }
        return false
      },
    },
  })

  const addLink = useCallback(() => {
    if (linkUrl && editor) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
      setLinkUrl('')
      setShowLinkModal(false)
    }
  }, [editor, linkUrl])

  const addImage = useCallback(() => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run()
      setImageUrl('')
      setShowImageModal(false)
    }
  }, [editor, imageUrl])

  const handleInlineImageUpload = useCallback((file: File) => {
    if (file && file.type.startsWith('image/') && editor) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const src = e.target?.result as string
        editor.chain().focus().setImage({ src }).run()
      }
      reader.readAsDataURL(file)
      setShowImageModal(false)
    }
  }, [editor])

  const handlePublish = async () => {
    if (!title.trim()) {
      alert('Please add a title')
      return
    }
    if (!editor) return

    const content = editor.getHTML()
    const excerpt = editor.getText().slice(0, 150) + (editor.getText().length > 150 ? '...' : '')

    const { data: newPost, error } = await api.posts.create({
      title: title.trim(),
      excerpt,
      content,
      files: codeFiles,
      technologies: techsToStrings(technologies),
      coverImage: coverImage || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200',
    })

    if (newPost && !error) {
      navigate(`/post/${newPost.id}`)
    } else {
      alert(error || 'Failed to create post')
    }
  }

  const colors = [
    '#000000', '#374151', '#dc2626', '#ea580c', '#ca8a04', 
    '#16a34a', '#0891b2', '#2563eb', '#7c3aed', '#db2777',
  ]

  const highlightColors = [
    '#fef08a', '#bbf7d0', '#bfdbfe', '#ddd6fe', '#fbcfe8',
  ]

  if (!editor) return null

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-[#252525] text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-[#333] transition-colors">
            <Eye size={18} />
            Preview
          </button>
          <button onClick={handlePublish} className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
            <Save size={18} />
            Publish
          </button>
        </div>
      </motion.div>

      {/* Cover Image */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        {coverImage ? (
          <div className="relative h-72 rounded-2xl overflow-hidden">
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <button onClick={() => setCoverImage('')} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors">
              <X size={18} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl text-gray-800 text-sm font-medium hover:bg-white transition-colors flex items-center gap-2">
              <Upload size={16} />
              Change Image
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`flex flex-col items-center justify-center h-56 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${isDragging ? 'border-gray-900 dark:border-gray-100 bg-gray-100 dark:bg-[#252525]' : 'border-gray-300 dark:border-[#333] hover:border-gray-400 dark:hover:border-gray-500 bg-white/50 dark:bg-[#1a1a1a]/50'}`}
          >
            <div className={`p-4 rounded-full mb-3 transition-colors ${isDragging ? 'bg-gray-200 dark:bg-[#333]' : 'bg-gray-100 dark:bg-[#252525]'}`}>
              <Upload size={28} className="text-gray-500 dark:text-gray-400" />
            </div>
            <span className="text-gray-700 dark:text-gray-300 font-medium mb-1">{isDragging ? 'Drop image here' : 'Click to upload or drag and drop'}</span>
            <span className="text-gray-400 dark:text-gray-500 text-sm">PNG, JPG, GIF up to 10MB</span>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileSelect(file) }} />
      </motion.div>

      {/* Title */}
      <motion.input
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        type="text"
        placeholder="Post title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full text-4xl font-bold bg-transparent border-0 focus:outline-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 mb-4"
      />

      {/* Technologies */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
        <TechVersionInput
          technologies={technologies}
          onChange={setTechnologies}
          placeholder="Add technology (press Enter)..."
          maxTags={20}
        />
      </motion.div>

      {/* Main Content Area */}
      <div className="flex gap-6">
        {/* Editor Container */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex-1 bg-white/60 dark:bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1 p-3 border-b border-gray-200 dark:border-[#333] bg-gray-50/50 dark:bg-[#252525]/50">
            <MenuButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo size={18} /></MenuButton>
            <Divider />
            
            {/* Font Family Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowFontFamily(!showFontFamily); setShowFontSize(false); setShowColorPicker(false) }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#333] hover:text-gray-900 dark:hover:text-gray-100 transition-all text-sm min-w-[100px]"
                title="Font Family"
              >
                <Type size={16} />
                <span className="truncate max-w-[70px]">
                  {editor.getAttributes('textStyle').fontFamily || 'Default'}
                </span>
                <ChevronDown size={14} />
              </button>
              {showFontFamily && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl z-50 border border-gray-200 dark:border-[#333] py-1 min-w-[160px] max-h-64 overflow-y-auto">
                  {fontFamilies.map((font) => (
                    <button
                      key={font.name}
                      onClick={() => {
                        if (font.value) {
                          editor.chain().focus().setFontFamily(font.value).run()
                        } else {
                          editor.chain().focus().unsetFontFamily().run()
                        }
                        setShowFontFamily(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-700 dark:text-gray-300 transition-colors"
                      style={{ fontFamily: font.value || 'inherit' }}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Font Size Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowFontSize(!showFontSize); setShowFontFamily(false); setShowColorPicker(false) }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#333] hover:text-gray-900 dark:hover:text-gray-100 transition-all text-sm min-w-[70px]"
                title="Font Size"
              >
                <ALargeSmall size={16} />
                <span>{editor.getAttributes('textStyle').fontSize || 'Size'}</span>
                <ChevronDown size={14} />
              </button>
              {showFontSize && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl z-50 border border-gray-200 dark:border-[#333] py-1 min-w-[100px] max-h-64 overflow-y-auto">
                  {fontSizes.map((size) => (
                    <button
                      key={size.label}
                      onClick={() => {
                        if (size.value) {
                          (editor.chain().focus() as any).setFontSize(size.value).run()
                        } else {
                          (editor.chain().focus() as any).unsetFontSize().run()
                        }
                        setShowFontSize(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Divider />
            
            <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold"><Bold size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic"><Italic size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline"><UnderlineIcon size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough"><Strikethrough size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Inline Code"><Code size={18} /></MenuButton>
            <Divider />
            <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 size={18} /></MenuButton>
            <Divider />
            <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List"><List size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered List"><ListOrdered size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} title="Task List"><CheckSquare size={18} /></MenuButton>
            <Divider />
            <MenuButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center"><AlignCenter size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right"><AlignRight size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Justify"><AlignJustify size={18} /></MenuButton>
            <Divider />
            <MenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Quote"><Quote size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule"><Minus size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="Code Block"><FileCode size={18} /></MenuButton>
            <Divider />
            <MenuButton onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editor.isActive('subscript')} title="Subscript"><SubIcon size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editor.isActive('superscript')} title="Superscript"><SuperIcon size={18} /></MenuButton>
            <Divider />
            <div className="relative">
              <MenuButton onClick={() => { setShowColorPicker(!showColorPicker); setShowFontFamily(false); setShowFontSize(false) }} title="Text Color"><Palette size={18} /></MenuButton>
              {showColorPicker && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl z-50 border border-gray-200 dark:border-[#333]">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Text Color</div>
                  <div className="flex gap-1 mb-3">
                    {colors.map((color) => (
                      <button key={color} onClick={() => { editor.chain().focus().setColor(color).run(); setShowColorPicker(false) }} className="w-6 h-6 rounded-full border-2 border-white dark:border-[#333] shadow-sm hover:scale-110 transition-transform" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Highlight</div>
                  <div className="flex gap-1">
                    {highlightColors.map((color) => (
                      <button key={color} onClick={() => { editor.chain().focus().toggleHighlight({ color }).run(); setShowColorPicker(false) }} className="w-6 h-6 rounded-full border-2 border-white dark:border-[#333] shadow-sm hover:scale-110 transition-transform" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <MenuButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} title="Highlight"><Highlighter size={18} /></MenuButton>
            <Divider />
            <MenuButton onClick={() => setShowLinkModal(true)} isActive={editor.isActive('link')} title="Add Link"><LinkIcon size={18} /></MenuButton>
            <MenuButton onClick={() => setShowImageModal(true)} title="Add Image"><ImageIcon size={18} /></MenuButton>
            <Divider />
            <MenuButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert Table"><TableIcon size={18} /></MenuButton>
            {editor.isActive('table') && (
              <>
                <MenuButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column"><ColumnsIcon size={18} /></MenuButton>
                <MenuButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row"><RowsIcon size={18} /></MenuButton>
                <MenuButton onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table"><Trash2 size={18} /></MenuButton>
              </>
            )}
          </div>
          <EditorContent editor={editor} className="min-h-[500px] dark:text-gray-100" />
        </motion.div>

        {/* Code Files Sidebar */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="w-72 shrink-0">
          <div className="bg-[#1a1a1a] rounded-xl overflow-hidden sticky top-8 border border-[#333]">
            <div className="flex items-center justify-between px-4 py-3 bg-[#0f0f0f] border-b border-[#333]">
              <span className="text-sm font-medium text-gray-300">Project Files</span>
              <div className="flex items-center gap-2">
                <button onClick={() => folderInputRef.current?.click()} className="text-xs text-gray-400 hover:text-white flex items-center gap-1" title="Upload Folder">
                  <Upload size={14} />
                  Folder
                </button>
                <button onClick={() => codeFileInputRef.current?.click()} className="text-xs text-gray-400 hover:text-white flex items-center gap-1" title="Upload Files">
                  <FileUp size={14} />
                  Files
                </button>
              </div>
            </div>
            
            {/* File Drop Zone */}
            <div
              onDrop={handleCodeFileDrop}
              onDragOver={(e) => { e.preventDefault(); setIsFileDragging(true) }}
              onDragLeave={() => setIsFileDragging(false)}
              className={`p-3 border-b border-[#333] transition-colors ${isFileDragging ? 'bg-[#252525]' : ''}`}
            >
              {codeFiles.length === 0 ? (
                <div className="text-center py-6">
                  <FileUp size={24} className="mx-auto text-gray-500 mb-2" />
                  <p className="text-gray-400 text-sm">Drop files or folders here</p>
                  <p className="text-gray-500 text-xs mt-1">.js, .ts, .html, .css, etc.</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto py-1">
                  {buildFileTree(codeFiles).map((node) => (
                    <FileTreeNodeComponent
                      key={node.path}
                      node={node}
                      depth={0}
                      expandedFolders={expandedFolders}
                      onToggleFolder={toggleFolder}
                      onRemoveFile={removeCodeFile}
                    />
                  ))}
                </div>
              )}
            </div>

            <input
              ref={codeFileInputRef}
              type="file"
              multiple
              accept=".js,.jsx,.ts,.tsx,.html,.css,.scss,.json,.md,.py,.rb,.go,.rs,.java,.php,.sql,.sh,.yaml,.yml,.toml,.env,.prisma,.graphql,.vue,.svelte"
              className="hidden"
              onChange={(e) => handleCodeFileSelect(e.target.files)}
            />
            
            {/* Folder input with webkitdirectory */}
            <input
              ref={(input) => {
                if (input) {
                  input.setAttribute('webkitdirectory', '')
                  input.setAttribute('directory', '')
                  ;(folderInputRef as any).current = input
                }
              }}
              type="file"
              multiple
              className="hidden"
              onChange={handleFolderSelect}
            />

            {/* Help text */}
            <div className="px-4 py-3 text-xs text-gray-500">
              Upload code files or entire folders. Nested folder structure is preserved.
            </div>
          </div>
        </motion.div>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowLinkModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-[#333]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Add Link</h3>
            <input type="url" placeholder="https://example.com" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent mb-4 bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" autoFocus />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowLinkModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Cancel</button>
              <button onClick={addLink} className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200">Add Link</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowImageModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-lg shadow-xl border border-gray-200 dark:border-[#333]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Add Inline Image</h3>

            {/* File Upload Area */}
            <div
              onClick={() => inlineImageInputRef.current?.click()}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files[0]
                if (file) handleInlineImageUpload(file)
              }}
              onDragOver={(e) => e.preventDefault()}
              className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 dark:border-[#333] rounded-xl cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-[#252525] transition-all mb-4"
            >
              <Upload size={32} className="text-gray-400 mb-2" />
              <span className="text-gray-600 dark:text-gray-300 font-medium">Click to upload or drag & drop</span>
              <span className="text-gray-400 dark:text-gray-500 text-sm mt-1">PNG, JPG, GIF, WebP</span>
            </div>
            <input
              ref={inlineImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleInlineImageUpload(file)
              }}
            />

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200 dark:bg-[#333]" />
              <span className="text-gray-400 dark:text-gray-500 text-sm">or paste URL</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-[#333]" />
            </div>

            <input type="url" placeholder="https://example.com/image.jpg" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent mb-4 bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />

            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowImageModal(false); setImageUrl('') }} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Cancel</button>
              <button onClick={addImage} disabled={!imageUrl} className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">Add from URL</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default CreatePost
