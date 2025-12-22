// Technology brand colors - solid fill with contrasting text
// Colors aligned with official logo colors
const techColors: Record<string, { bg: string; text: string }> = {
  // JavaScript ecosystem
  javascript: { bg: '#f7df1e', text: '#000000' },
  typescript: { bg: '#3178c6', text: '#ffffff' },
  react: { bg: '#61dafb', text: '#000000' },
  vue: { bg: '#42b883', text: '#ffffff' },
  angular: { bg: '#dd0031', text: '#ffffff' },
  svelte: { bg: '#ff3e00', text: '#ffffff' },
  nextjs: { bg: '#000000', text: '#ffffff' },
  next: { bg: '#000000', text: '#ffffff' },
  nuxt: { bg: '#00dc82', text: '#000000' },
  node: { bg: '#339933', text: '#ffffff' },
  nodejs: { bg: '#339933', text: '#ffffff' },
  express: { bg: '#000000', text: '#ffffff' },
  bun: { bg: '#fbf0df', text: '#14110f' },
  deno: { bg: '#000000', text: '#ffffff' },
  elysia: { bg: '#a855f7', text: '#ffffff' },

  // Styling
  css: { bg: '#264de4', text: '#ffffff' },
  tailwind: { bg: '#06b6d4', text: '#ffffff' },
  tailwindcss: { bg: '#06b6d4', text: '#ffffff' },
  sass: { bg: '#cc6699', text: '#ffffff' },
  scss: { bg: '#cc6699', text: '#ffffff' },
  bootstrap: { bg: '#7952b3', text: '#ffffff' },

  // Backend & Languages
  python: { bg: '#3776ab', text: '#ffffff' },
  django: { bg: '#092e20', text: '#ffffff' },
  flask: { bg: '#000000', text: '#ffffff' },
  fastapi: { bg: '#009688', text: '#ffffff' },
  rust: { bg: '#000000', text: '#ffffff' },
  go: { bg: '#00add8', text: '#ffffff' },
  golang: { bg: '#00add8', text: '#ffffff' },
  java: { bg: '#ed8b00', text: '#000000' },
  kotlin: { bg: '#7f52ff', text: '#ffffff' },
  swift: { bg: '#f05138', text: '#ffffff' },
  ruby: { bg: '#cc342d', text: '#ffffff' },
  rails: { bg: '#cc0000', text: '#ffffff' },
  php: { bg: '#777bb4', text: '#ffffff' },
  laravel: { bg: '#ff2d20', text: '#ffffff' },
  csharp: { bg: '#68217a', text: '#ffffff' },
  dotnet: { bg: '#512bd4', text: '#ffffff' },
  elixir: { bg: '#4b275f', text: '#ffffff' },

  // Databases
  postgresql: { bg: '#336791', text: '#ffffff' },
  postgres: { bg: '#336791', text: '#ffffff' },
  mysql: { bg: '#4479a1', text: '#ffffff' },
  mongodb: { bg: '#47a248', text: '#ffffff' },
  redis: { bg: '#dc382d', text: '#ffffff' },
  sqlite: { bg: '#003b57', text: '#ffffff' },
  turso: { bg: '#4ff8d2', text: '#000000' },
  supabase: { bg: '#3ecf8e', text: '#000000' },
  firebase: { bg: '#ffca28', text: '#000000' },
  prisma: { bg: '#2d3748', text: '#ffffff' },
  drizzle: { bg: '#c5f74f', text: '#000000' },

  // Cloud & DevOps
  aws: { bg: '#ff9900', text: '#000000' },
  azure: { bg: '#0078d4', text: '#ffffff' },
  gcp: { bg: '#4285f4', text: '#ffffff' },
  docker: { bg: '#2496ed', text: '#ffffff' },
  kubernetes: { bg: '#326ce5', text: '#ffffff' },
  vercel: { bg: '#000000', text: '#ffffff' },
  netlify: { bg: '#00c7b7', text: '#000000' },
  cloudflare: { bg: '#f38020', text: '#000000' },
  railway: { bg: '#0b0d0e', text: '#ffffff' },
  heroku: { bg: '#430098', text: '#ffffff' },

  // Tools & Others
  git: { bg: '#f05032', text: '#ffffff' },
  github: { bg: '#181717', text: '#ffffff' },
  gitlab: { bg: '#fc6d26', text: '#000000' },
  graphql: { bg: '#e10098', text: '#ffffff' },
  rest: { bg: '#000000', text: '#ffffff' },
  api: { bg: '#000000', text: '#ffffff' },
  webpack: { bg: '#8dd6f9', text: '#000000' },
  vite: { bg: '#646cff', text: '#ffffff' },
  eslint: { bg: '#4b32c3', text: '#ffffff' },
  prettier: { bg: '#f7b93e', text: '#000000' },
  jest: { bg: '#c21855', text: '#ffffff' },
  vitest: { bg: '#6e9f18', text: '#ffffff' },
  cypress: { bg: '#17202c', text: '#ffffff' },

  // Mobile
  'react native': { bg: '#61dafb', text: '#000000' },
  reactnative: { bg: '#61dafb', text: '#000000' },
  flutter: { bg: '#02569b', text: '#ffffff' },
  ios: { bg: '#000000', text: '#ffffff' },
  android: { bg: '#3ddc84', text: '#000000' },

  // AI/ML
  openai: { bg: '#412991', text: '#ffffff' },
  tensorflow: { bg: '#ff6f00', text: '#000000' },
  pytorch: { bg: '#ee4c2c', text: '#ffffff' },

  // Categories
  frontend: { bg: '#3b82f6', text: '#ffffff' },
  backend: { bg: '#10b981', text: '#ffffff' },
  fullstack: { bg: '#8b5cf6', text: '#ffffff' },
  devops: { bg: '#f59e0b', text: '#000000' },
  database: { bg: '#ef4444', text: '#ffffff' },
  edge: { bg: '#06b6d4', text: '#ffffff' },
  serverless: { bg: '#ff9900', text: '#000000' },
}

// Default color for unknown technologies
const defaultColor = { bg: '#6b7280', text: '#ffffff' }

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

export const TechTag = ({
  tech,
  size = 'md',
  className = '',
  onClick,
  onRemove,
}: TechTagProps) => {
  const normalizedTech = tech.toLowerCase().replace(/[.\s-]/g, '')
  const colors = techColors[normalizedTech] || defaultColor
  const borderColor = darkenColor(colors.bg, 15)

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }

  const styles: React.CSSProperties = {
    backgroundColor: colors.bg,
    color: colors.text,
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
        inline-flex items-center gap-1.5 rounded-full font-semibold
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
          className="hover:opacity-60 transition-opacity ml-0.5"
          style={{ color: colors.text }}
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
  return techColors[normalizedTech] || defaultColor
}

export default TechTag
