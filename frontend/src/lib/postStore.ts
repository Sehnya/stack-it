// Post types for the app

export interface CodeFile {
  name: string
  language: string
  code: string
}

export interface PostData {
  id: string
  title: string
  excerpt: string
  content: string
  files: CodeFile[]
  favorites: number
  technologies: string[]
  coverImage: string
  createdAt: string
  author: {
    id: string
    username: string
    avatar: string
  }
}

// File extension to language mapping
export const getLanguageFromFilename = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const langMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'jsx',
    ts: 'typescript',
    tsx: 'tsx',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    kt: 'kotlin',
    swift: 'swift',
    php: 'php',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    md: 'markdown',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    dockerfile: 'dockerfile',
    toml: 'toml',
    env: 'shell',
    gitignore: 'shell',
    prisma: 'prisma',
    graphql: 'graphql',
    gql: 'graphql',
    vue: 'vue',
    svelte: 'svelte',
  }
  return langMap[ext] || 'text'
}
