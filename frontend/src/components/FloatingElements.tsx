import { motion } from 'framer-motion'
import { Code2, Database, Globe, Layers, Terminal, Cpu } from 'lucide-react'

const icons = [Code2, Database, Globe, Layers, Terminal, Cpu]

interface FloatingElementProps {
  count?: number
}

export const FloatingElements = ({ count = 6 }: FloatingElementProps) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => {
        const Icon = icons[i % icons.length]
        const randomX = Math.random() * 100
        const randomDelay = Math.random() * 2
        const randomDuration = 15 + Math.random() * 10
        const size = 20 + Math.random() * 20

        return (
          <motion.div
            key={i}
            className="absolute text-gray-300/30"
            style={{
              left: `${randomX}%`,
              top: '-50px',
            }}
            animate={{
              y: ['0vh', '110vh'],
              rotate: [0, 360],
              opacity: [0, 0.5, 0.5, 0],
            }}
            transition={{
              duration: randomDuration,
              delay: randomDelay,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <Icon size={size} />
          </motion.div>
        )
      })}
    </div>
  )
}

// Grid pattern background
export const GridPattern = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#e5e7eb]" />
    </div>
  )
}

// Animated gradient orbs
export const GradientOrbs = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full bg-gray-300/30 blur-[100px]"
        style={{ top: '10%', left: '10%' }}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full bg-gray-400/20 blur-[80px]"
        style={{ bottom: '20%', right: '10%' }}
        animate={{
          x: [0, -40, 0],
          y: [0, -40, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}
