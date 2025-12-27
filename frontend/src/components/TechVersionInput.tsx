import { useState, useEffect, useRef } from 'react'
import { X, ChevronDown, Check, Loader2 } from 'lucide-react'
import { getTechIconUrl, getTechColor } from './TechTag'

// Known tech stacks with their package registry info
const techRegistry: Record<string, { registry: 'npm' | 'pypi' | 'static'; package?: string; versions?: string[] }> = {
  // JavaScript/TypeScript ecosystem (npm)
  react: { registry: 'npm', package: 'react' },
  vue: { registry: 'npm', package: 'vue' },
  angular: { registry: 'npm', package: '@angular/core' },
  svelte: { registry: 'npm', package: 'svelte' },
  nextjs: { registry: 'npm', package: 'next' },
  next: { registry: 'npm', package: 'next' },
  nuxt: { registry: 'npm', package: 'nuxt' },
  typescript: { registry: 'npm', package: 'typescript' },
  nodejs: { registry: 'static', versions: ['22.x', '21.x', '20.x LTS', '18.x LTS'] },
  node: { registry: 'static', versions: ['22.x', '21.x', '20.x LTS', '18.x LTS'] },
  express: { registry: 'npm', package: 'express' },
  elysia: { registry: 'npm', package: 'elysia' },
  bun: { registry: 'static', versions: ['1.1.x', '1.0.x'] },
  deno: { registry: 'static', versions: ['2.x', '1.x'] },
  vite: { registry: 'npm', package: 'vite' },
  tailwindcss: { registry: 'npm', package: 'tailwindcss' },
  tailwind: { registry: 'npm', package: 'tailwindcss' },
  prisma: { registry: 'npm', package: 'prisma' },
  
  // Python ecosystem (pypi)
  python: { registry: 'static', versions: ['3.12', '3.11', '3.10', '3.9'] },
  django: { registry: 'pypi', package: 'django' },
  flask: { registry: 'pypi', package: 'flask' },
  fastapi: { registry: 'pypi', package: 'fastapi' },
  
  // Databases (static versions)
  postgresql: { registry: 'static', versions: ['16', '15', '14', '13'] },
  postgres: { registry: 'static', versions: ['16', '15', '14', '13'] },
  mysql: { registry: 'static', versions: ['8.0', '5.7'] },
  mongodb: { registry: 'static', versions: ['7.0', '6.0', '5.0'] },
  redis: { registry: 'static', versions: ['7.2', '7.0', '6.2'] },
  sqlite: { registry: 'static', versions: ['3.x'] },
  
  // Cloud/DevOps (static)
  docker: { registry: 'static', versions: ['24.x', '23.x', '20.x'] },
  kubernetes: { registry: 'static', versions: ['1.29', '1.28', '1.27'] },
}

interface TechWithVersion {
  name: string
  version?: string
}

interface TechVersionInputProps {
  technologies: TechWithVersion[]
  onChange: (techs: TechWithVersion[]) => void
  placeholder?: string
  maxTags?: number
}

// Cache for fetched versions
const versionCache: Record<string, string[]> = {}

async function fetchNpmVersions(packageName: string): Promise<string[]> {
  const cacheKey = `npm:${packageName}`
  if (versionCache[cacheKey]) return versionCache[cacheKey]
  
  try {
    const res = await fetch(`https://registry.npmjs.org/${packageName}`)
    if (!res.ok) return []
    const data = await res.json()
    const versions = Object.keys(data.versions || {})
      .filter(v => !v.includes('-')) // Filter out pre-releases
      .slice(-10) // Get last 10 versions
      .reverse()
    versionCache[cacheKey] = versions
    return versions
  } catch {
    return []
  }
}

async function fetchPypiVersions(packageName: string): Promise<string[]> {
  const cacheKey = `pypi:${packageName}`
  if (versionCache[cacheKey]) return versionCache[cacheKey]
  
  try {
    const res = await fetch(`https://pypi.org/pypi/${packageName}/json`)
    if (!res.ok) return []
    const data = await res.json()
    const versions = Object.keys(data.releases || {})
      .filter(v => !v.includes('a') && !v.includes('b') && !v.includes('rc'))
      .slice(-10)
      .reverse()
    versionCache[cacheKey] = versions
    return versions
  } catch {
    return []
  }
}

export const TechVersionInput = ({
  technologies,
  onChange,
  placeholder = 'Add technology...',
  maxTags = 20,
}: TechVersionInputProps) => {
  const [input, setInput] = useState('')
  const [showDropdown, setShowDropdown] = useState<number | null>(null)
  const [versions, setVersions] = useState<string[]>([])
  const [loadingVersions, setLoadingVersions] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchVersions = async (techName: string) => {
    const normalized = techName.toLowerCase().replace(/[.\s-]/g, '')
    const registry = techRegistry[normalized]
    
    if (!registry) {
      setVersions([])
      return
    }
    
    setLoadingVersions(true)
    
    if (registry.registry === 'static' && registry.versions) {
      setVersions(registry.versions)
    } else if (registry.registry === 'npm' && registry.package) {
      const v = await fetchNpmVersions(registry.package)
      setVersions(v)
    } else if (registry.registry === 'pypi' && registry.package) {
      const v = await fetchPypiVersions(registry.package)
      setVersions(v)
    } else {
      setVersions([])
    }
    
    setLoadingVersions(false)
  }

  const handleAddTech = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault()
      if (technologies.length >= maxTags) return
      if (technologies.some(t => t.name.toLowerCase() === input.trim().toLowerCase())) return
      
      onChange([...technologies, { name: input.trim() }])
      setInput('')
    }
  }

  const handleRemoveTech = (index: number) => {
    onChange(technologies.filter((_, i) => i !== index))
  }

  const handleVersionClick = async (index: number) => {
    if (showDropdown === index) {
      setShowDropdown(null)
      return
    }
    setShowDropdown(index)
    await fetchVersions(technologies[index].name)
  }

  const handleSelectVersion = (index: number, version: string) => {
    const updated = [...technologies]
    updated[index] = { ...updated[index], version }
    onChange(updated)
    setShowDropdown(null)
  }

  const handleClearVersion = (index: number) => {
    const updated = [...technologies]
    updated[index] = { ...updated[index], version: undefined }
    onChange(updated)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {technologies.map((tech, index) => {
          const icon = getTechIconUrl(tech.name)
          const colors = getTechColor(tech.name)
          
          return (
            <div key={index} className="relative" ref={showDropdown === index ? dropdownRef : undefined}>
              <div
                className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg text-sm font-medium border transition-all"
                style={{
                  backgroundColor: colors.bg + '20',
                  borderColor: colors.bg + '40',
                  color: colors.bg,
                }}
              >
                {icon && (
                  <img src={icon} alt="" className="w-4 h-4" />
                )}
                <span>{tech.name}</span>
                
                {/* Version button */}
                <button
                  type="button"
                  onClick={() => handleVersionClick(index)}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                >
                  {tech.version || 'version'}
                  <ChevronDown size={12} />
                </button>
                
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveTech(index)}
                  className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              
              {/* Version dropdown */}
              {showDropdown === index && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#333] shadow-lg z-50 overflow-hidden">
                  {loadingVersions ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 size={16} className="animate-spin text-gray-400" />
                    </div>
                  ) : versions.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto">
                      {tech.version && (
                        <button
                          type="button"
                          onClick={() => handleClearVersion(index)}
                          className="w-full px-3 py-2 text-left text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252525] border-b border-gray-100 dark:border-[#333]"
                        >
                          Clear version
                        </button>
                      )}
                      {versions.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => handleSelectVersion(index, v)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#252525] flex items-center justify-between"
                        >
                          <span className="text-gray-900 dark:text-gray-100">{v}</span>
                          {tech.version === v && (
                            <Check size={14} className="text-green-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                      No versions available
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {technologies.length < maxTags && (
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleAddTech}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400"
        />
      )}
    </div>
  )
}

// Helper to convert TechWithVersion array to string array (for API compatibility)
export const techsToStrings = (techs: TechWithVersion[]): string[] => {
  return techs.map(t => t.version ? `${t.name}@${t.version}` : t.name)
}

// Helper to convert string array to TechWithVersion array
export const stringsToTechs = (strings: string[]): TechWithVersion[] => {
  return strings.map(s => {
    const [name, version] = s.split('@')
    return { name, version }
  })
}

export default TechVersionInput
