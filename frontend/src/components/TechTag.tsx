// Technology brand colors and logos
// Using Simple Icons CDN for logos: https://simpleicons.org/
const techData: Record<string, { bg: string; text: string; icon?: string }> = {
  // JavaScript ecosystem
  javascript: { bg: '#f7df1e', text: '#000000', icon: 'javascript' },
  typescript: { bg: '#3178c6', text: '#ffffff', icon: 'typescript' },
  react: { bg: '#61dafb', text: '#000000', icon: 'react' },
  vue: { bg: '#42b883', text: '#ffffff', icon: 'vuedotjs' },
  angular: { bg: '#dd0031', text: '#ffffff', icon: 'angular' },
  svelte: { bg: '#ff3e00', text: '#ffffff', icon: 'svelte' },
  nextjs: { bg: '#000000', text: '#ffffff', icon: 'nextdotjs' },
  next: { bg: '#000000', text: '#ffffff', icon: 'nextdotjs' },
  nuxt: { bg: '#00dc82', text: '#000000', icon: 'nuxtdotjs' },
  node: { bg: '#339933', text: '#ffffff', icon: 'nodedotjs' },
  nodejs: { bg: '#339933', text: '#ffffff', icon: 'nodedotjs' },
  express: { bg: '#000000', text: '#ffffff', icon: 'express' },
  bun: { bg: '#fbf0df', text: '#14110f', icon: 'bun' },
  deno: { bg: '#000000', text: '#ffffff', icon: 'deno' },
  elysia: { bg: '#a855f7', text: '#ffffff' },

  // Styling
  css: { bg: '#264de4', text: '#ffffff', icon: 'css3' },
  tailwind: { bg: '#06b6d4', text: '#ffffff', icon: 'tailwindcss' },
  tailwindcss: { bg: '#06b6d4', text: '#ffffff', icon: 'tailwindcss' },
  sass: { bg: '#cc6699', text: '#ffffff', icon: 'sass' },
  scss: { bg: '#cc6699', text: '#ffffff', icon: 'sass' },
  bootstrap: { bg: '#7952b3', text: '#ffffff', icon: 'bootstrap' },

  // Backend & Languages
  python: { bg: '#3776ab', text: '#ffffff', icon: 'python' },
  django: { bg: '#092e20', text: '#ffffff', icon: 'django' },
  flask: { bg: '#000000', text: '#ffffff', icon: 'flask' },
  fastapi: { bg: '#009688', text: '#ffffff', icon: 'fastapi' },
  rust: { bg: '#000000', text: '#ffffff', icon: 'rust' },
  go: { bg: '#00add8', text: '#ffffff', icon: 'go' },
  golang: { bg: '#00add8', text: '#ffffff', icon: 'go' },
  java: { bg: '#ed8b00', text: '#000000' },
  kotlin: { bg: '#7f52ff', text: '#ffffff', icon: 'kotlin' },
  swift: { bg: '#f05138', text: '#ffffff', icon: 'swift' },
  ruby: { bg: '#cc342d', text: '#ffffff', icon: 'ruby' },
  rails: { bg: '#cc0000', text: '#ffffff', icon: 'rubyonrails' },
  php: { bg: '#777bb4', text: '#ffffff', icon: 'php' },
  laravel: { bg: '#ff2d20', text: '#ffffff', icon: 'laravel' },
  csharp: { bg: '#68217a', text: '#ffffff', icon: 'csharp' },
  dotnet: { bg: '#512bd4', text: '#ffffff', icon: 'dotnet' },
  elixir: { bg: '#4b275f', text: '#ffffff', icon: 'elixir' },

  // Databases
  postgresql: { bg: '#336791', text: '#ffffff', icon: 'postgresql' },
  postgres: { bg: '#336791', text: '#ffffff', icon: 'postgresql' },
  mysql: { bg: '#4479a1', text: '#ffffff', icon: 'mysql' },
  mongodb: { bg: '#47a248', text: '#ffffff', icon: 'mongodb' },
  redis: { bg: '#dc382d', text: '#ffffff', icon: 'redis' },
  sqlite: { bg: '#003b57', text: '#ffffff', icon: 'sqlite' },
  turso: { bg: '#4ff8d2', text: '#000000', icon: 'turso' },
  supabase: { bg: '#3ecf8e', text: '#000000', icon: 'supabase' },
  firebase: { bg: '#ffca28', text: '#000000', icon: 'firebase' },
  prisma: { bg: '#2d3748', text: '#ffffff', icon: 'prisma' },
  drizzle: { bg: '#c5f74f', text: '#000000' },

  // Cloud & DevOps
  aws: { bg: '#ff9900', text: '#000000', icon: 'amazonwebservices' },
  azure: { bg: '#0078d4', text: '#ffffff', icon: 'microsoftazure' },
  gcp: { bg: '#4285f4', text: '#ffffff', icon: 'googlecloud' },
  docker: { bg: '#2496ed', text: '#ffffff', icon: 'docker' },
  kubernetes: { bg: '#326ce5', text: '#ffffff', icon: 'kubernetes' },
  vercel: { bg: '#000000', text: '#ffffff', icon: 'vercel' },
  netlify: { bg: '#00c7b7', text: '#000000', icon: 'netlify' },
  cloudflare: { bg: '#f38020', text: '#000000', icon: 'cloudflare' },
  railway: { bg: '#0b0d0e', text: '#ffffff', icon: 'railway' },
  heroku: { bg: '#430098', text: '#ffffff', icon: 'heroku' },

  // Tools & Others
  git: { bg: '#f05032', text: '#ffffff', icon: 'git' },
  github: { bg: '#181717', text: '#ffffff', icon: 'github' },
  gitlab: { bg: '#fc6d26', text: '#000000', icon: 'gitlab' },
  graphql: { bg: '#e10098', text: '#ffffff', icon: 'graphql' },
  rest: { bg: '#000000', text: '#ffffff' },
  api: { bg: '#000000', text: '#ffffff' },
  webpack: { bg: '#8dd6f9', text: '#000000', icon: 'webpack' },
  vite: { bg: '#646cff', text: '#ffffff', icon: 'vite' },
  eslint: { bg: '#4b32c3', text: '#ffffff', icon: 'eslint' },
  prettier: { bg: '#f7b93e', text: '#000000', icon: 'prettier' },
  jest: { bg: '#c21855', text: '#ffffff', icon: 'jest' },
  vitest: { bg: '#6e9f18', text: '#ffffff', icon: 'vitest' },
  cypress: { bg: '#17202c', text: '#ffffff', icon: 'cypress' },

  // Mobile
  'react native': { bg: '#61dafb', text: '#000000', icon: 'react' },
  reactnative: { bg: '#61dafb', text: '#000000', icon: 'react' },
  flutter: { bg: '#02569b', text: '#ffffff', icon: 'flutter' },
  ios: { bg: '#000000', text: '#ffffff', icon: 'ios' },
  android: { bg: '#3ddc84', text: '#000000', icon: 'android' },

  // AI/ML
  openai: { bg: '#412991', text: '#ffffff', icon: 'openai' },
  tensorflow: { bg: '#ff6f00', text: '#000000', icon: 'tensorflow' },
  pytorch: { bg: '#ee4c2c', text: '#ffffff', icon: 'pytorch' },

  // Categories
  frontend: { bg: '#3b82f6', text: '#ffffff' },
  backend: { bg: '#10b981', text: '#ffffff' },
  fullstack: { bg: '#8b5cf6', text: '#ffffff' },
  devops: { bg: '#f59e0b', text: '#000000' },
  database: { bg: '#ef4444', text: '#ffffff' },
  edge: { bg: '#06b6d4', text: '#ffffff' },
  serverless: { bg: '#ff9900', text: '#000000' },
  
  // Additional
  html: { bg: '#e34f26', text: '#ffffff', icon: 'html5' },
  html5: { bg: '#e34f26', text: '#ffffff', icon: 'html5' },
  npm: { bg: '#cb3837', text: '#ffffff', icon: 'npm' },
  yarn: { bg: '#2c8ebb', text: '#ffffff', icon: 'yarn' },
  pnpm: { bg: '#f69220', text: '#000000', icon: 'pnpm' },
  linux: { bg: '#fcc624', text: '#000000', icon: 'linux' },
  ubuntu: { bg: '#e95420', text: '#ffffff', icon: 'ubuntu' },
  nginx: { bg: '#009639', text: '#ffffff', icon: 'nginx' },
  apache: { bg: '#d22128', text: '#ffffff', icon: 'apache' },
  markdown: { bg: '#000000', text: '#ffffff', icon: 'markdown' },
  json: { bg: '#000000', text: '#ffffff', icon: 'json' },
}

// Default color for unknown technologies
const defaultData = { bg: '#6b7280', text: '#ffffff' }

interface TechTagProps {
  tech: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  onRemove?: () => void
}

// Helper to darken a hex color
const darkenColor = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.max((num >> 16) - amt, 0)
  const G = Math.max(((num >> 8) & 0x00ff) - amt, 0)
  const B = Math.max((num & 0x0000ff) - amt, 0)
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
}

// Custom local icons (override CDN)
const localIcons: Record<string, string> = {
  bun: '/icons/bun.svg',
  elysia: '/images/elysia-logo.svg',
}

// Get colored icon URL (original brand colors)
export const getTechIconUrl = (tech: string): string | null => {
  const normalizedTech = tech.toLowerCase().replace(/[.\s-]/g, '')
  
  // Check for local icon first
  if (localIcons[normalizedTech]) {
    return localIcons[normalizedTech]
  }
  
  const data = techData[normalizedTech]
  if (!data?.icon) return null
  return `https://cdn.simpleicons.org/${data.icon}`
}

export const TechTag = ({
  tech,
  size = 'md',
  className = '',
  onClick,
  onRemove,
}: TechTagProps) => {
  const normalizedTech = tech.toLowerCase().replace(/[.\s-]/g, '')
  const data = techData[normalizedTech] || defaultData
  const borderColor = darkenColor(data.bg, 15)

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }

  const styles: React.CSSProperties = {
    backgroundColor: data.bg,
    color: data.text,
    border: `2px solid ${borderColor}`,
    boxShadow: `
      inset 0 1px 0 0 rgba(255,255,255,0.2),
      inset 0 -1px 0 0 rgba(0,0,0,0.1),
      0 2px 4px -1px rgba(0,0,0,0.15)
    `,
  }

  return (
    <span
      onClick={onClick}
      style={styles}
      className={`
        inline-flex items-center rounded-full font-semibold
        ${sizeClasses[size]}
        ${onClick ? 'cursor-pointer hover:brightness-110 active:brightness-95 transition-all' : ''}
        hover:shadow-md active:shadow-sm transition-shadow
        ${className}
      `}
    >
      {tech}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="hover:opacity-60 transition-opacity ml-1"
          style={{ color: data.text }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  )
}

// Export the colors map for use elsewhere
export const getTechColor = (tech: string) => {
  const normalizedTech = tech.toLowerCase().replace(/[.\s-]/g, '')
  return techData[normalizedTech] || defaultData
}

// Export icon getter for use elsewhere
export const getTechIcon = (tech: string) => {
  const normalizedTech = tech.toLowerCase().replace(/[.\s-]/g, '')
  return techData[normalizedTech]?.icon
}

export default TechTag
