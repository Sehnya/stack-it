import { motion } from 'framer-motion'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

type Theme = 'light' | 'dark' | 'system'

interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown'
  className?: string
}

export function ThemeToggle({ variant = 'dropdown', className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  const options: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'system', icon: Monitor, label: 'System' },
    { value: 'dark', icon: Moon, label: 'Dark' },
  ]

  if (variant === 'dropdown') {
    return (
      <div className={`flex items-center gap-1 p-1 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl ${className}`}>
        {options.map(({ value, icon: Icon, label }) => (
          <motion.button
            key={value}
            onClick={() => setTheme(value)}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              theme === value
                ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            title={label}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </motion.button>
        ))}
      </div>
    )
  }

  // Simple icon toggle (cycles through: light -> system -> dark -> light)
  const cycleTheme = () => {
    const order: Theme[] = ['light', 'system', 'dark']
    const currentIndex = order.indexOf(theme)
    const nextIndex = (currentIndex + 1) % order.length
    setTheme(order[nextIndex])
  }

  const currentOption = options.find((o) => o.value === theme)
  const CurrentIcon = currentOption?.icon || Sun

  return (
    <motion.button
      onClick={cycleTheme}
      whileTap={{ scale: 0.95 }}
      className={`p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
      title={`Theme: ${theme}`}
    >
      <CurrentIcon size={20} />
    </motion.button>
  )
}

export default ThemeToggle
