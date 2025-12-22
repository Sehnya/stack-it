import { motion, useScroll, useTransform } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { useRef } from 'react'
import {
  ArrowRight,
  Code2,
  Users,
  Zap,
  MessageSquare,
  Heart,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { BlurText } from '../components/AnimatedText'
import { Magnet } from '../components/Magnet'
import { SpotlightCard } from '../components/SpotlightCard'
import Prism from '../components/Prism'
import CardSwap, { Card } from '../components/CardSwap'

const Landing = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95])

  const techStack = [
    'React',
    'TypeScript',
    'Bun',
    'Prisma',
    'Tailwind',
    'Elysia',
  ]

  return (
    <div ref={containerRef} className="min-h-screen bg-[#e5e7eb] relative">

      {/* Hero Section with ColorBends Background */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      >
        {/* Prism Background */}
        <div className="absolute inset-0 z-0 bg-black">
          <Prism
            animationType="rotate"
            timeScale={0.5}
            height={3.5}
            baseWidth={5.5}
            scale={3.6}
            hueShift={0}
            colorFrequency={1}
            noise={0.1}
            glow={0.7}
            bloom={0.8}
            transparent={false}
          />
        </div>

        {/* Gradient overlay for readability */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#e5e7eb] to-transparent z-[1]" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* White Stack-it Logo */}
          <motion.img
            src="/images/white-logo.png"
            alt="Stack-it"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-32 h-32 mx-auto mb-6 -mt-5 object-contain"
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black/30 backdrop-blur-xl rounded-full text-sm text-white/80 mb-8 border border-white/10"
          >
            <Sparkles size={14} className="text-yellow-400" />
            <span>Built by developers, for developers</span>
            <ChevronRight size={14} />
          </motion.div>

          <h1 className="text-6xl md:text-7xl font-bold text-white leading-tight mb-6">
            <BlurText text="Share your stack," delay={0.3} />
            <br />
            <span className="text-white/60">
              <BlurText text="grow together." delay={0.6} />
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="text-xl text-white/70 mb-10 max-w-2xl mx-auto"
          >
            The community where developers share tech stacks, discover tools,
            and connect with builders worldwide.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="flex items-center justify-center gap-4 mb-16"
          >
            <Magnet strength={0.15}>
              <NavLink
                to="/register"
                className="group flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-2xl font-medium hover:bg-gray-100 transition-all hover:shadow-xl"
              >
                Get Started Free
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </NavLink>
            </Magnet>
            <NavLink
              to="/login"
              className="px-8 py-4 bg-black/30 backdrop-blur-xl text-white rounded-2xl font-medium hover:bg-black/40 transition-colors border border-white/10"
            >
              I have an account
            </NavLink>
          </motion.div>

          {/* Animated tech stack pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {techStack.map((tech, index) => (
              <motion.span
                key={tech}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="px-4 py-2 bg-black/30 backdrop-blur-xl rounded-full text-sm text-white/80 cursor-default border border-white/10"
              >
                {tech}
              </motion.span>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center p-2"
          >
            <motion.div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Features Section with CardSwap */}
      <section className="py-32 px-6 relative bg-[#e5e7eb] overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating gradient orbs */}
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-br from-gray-300/40 to-gray-400/20 blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            style={{ top: '-10%', left: '-10%' }}
          />
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-br from-gray-200/50 to-gray-300/30 blur-3xl"
            animate={{
              x: [0, -80, 0],
              y: [0, 60, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            style={{ bottom: '10%', right: '-5%' }}
          />
          <motion.div
            className="absolute w-[300px] h-[300px] rounded-full bg-gradient-to-br from-gray-400/30 to-transparent blur-2xl"
            animate={{
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            style={{ top: '40%', left: '30%' }}
          />
          
          {/* Subtle grid pattern */}
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
          
          {/* Floating dots */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-gray-400/40"
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.3,
              }}
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
            />
          ))}
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-2 gap-16 items-center">
            {/* Left side - Text content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Everything you need to share & grow
              </h2>
              <p className="text-gray-600 text-lg mb-8">
                Built for developers who want to showcase their work, discover
                new tools, and learn from others in the community.
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: Code2,
                    title: 'Share Your Stack',
                    description: 'Post your tech stack and get valuable feedback.',
                  },
                  {
                    icon: Users,
                    title: 'Connect with Devs',
                    description: 'Join discussions and grow your network.',
                  },
                  {
                    icon: Zap,
                    title: 'Stay Updated',
                    description: 'Get the latest trends in tech stacks.',
                  },
                  {
                    icon: MessageSquare,
                    title: 'Engage & Learn',
                    description: 'Comment, ask questions, share knowledge.',
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
                      <feature.icon size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right side - CardSwap */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative h-[500px] flex items-center justify-center"
            >
              <CardSwap
                cardDistance={50}
                verticalDistance={60}
                delay={4000}
                pauseOnHover={true}
                width={380}
                height={280}
                skewAmount={4}
                easing="elastic"
              >
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-full bg-gray-200"
                      style={{
                        backgroundImage: 'url(https://i.pravatar.cc/100?img=12)',
                        backgroundSize: 'cover',
                      }}
                    />
                    <div>
                      <div className="font-semibold text-gray-900">Alex Chen</div>
                      <div className="text-sm text-gray-500">Full Stack Dev</div>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">My SaaS Stack</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Building a modern SaaS with these amazing tools...
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      Next.js
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      Prisma
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      Tailwind
                    </span>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-full bg-gray-200"
                      style={{
                        backgroundImage: 'url(https://i.pravatar.cc/100?img=25)',
                        backgroundSize: 'cover',
                      }}
                    />
                    <div>
                      <div className="font-semibold text-gray-900">Sarah Kim</div>
                      <div className="text-sm text-gray-500">Backend Engineer</div>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">API Architecture</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    High-performance APIs with modern tooling...
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      Bun
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      Elysia
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      Turso
                    </span>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-full bg-gray-200"
                      style={{
                        backgroundImage: 'url(https://i.pravatar.cc/100?img=33)',
                        backgroundSize: 'cover',
                      }}
                    />
                    <div>
                      <div className="font-semibold text-gray-900">Mike Johnson</div>
                      <div className="text-sm text-gray-500">Frontend Dev</div>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">React Native App</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Cross-platform mobile development stack...
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      Expo
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      TypeScript
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      Zustand
                    </span>
                  </div>
                </Card>
              </CardSwap>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 px-6 overflow-hidden bg-[#e5e7eb]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="flex -space-x-3">
                {[1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="w-10 h-10 rounded-full bg-gray-300 border-2 border-white"
                    style={{
                      backgroundImage: `url(https://i.pravatar.cc/100?img=${i + 10})`,
                      backgroundSize: 'cover',
                    }}
                  />
                ))}
              </div>
              <span className="text-gray-600">
                From our{' '}
                <span className="font-semibold text-gray-900">founding team</span>
              </span>
            </div>

            <div className="text-center max-w-2xl mx-auto">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-2xl text-gray-700 italic mb-6"
              >
                "We built Stack-it because we wanted a place to share our tech
                stacks and learn from other developers. We're excited to grow
                this community together."
              </motion.p>
              <div className="flex items-center justify-center gap-3">
                <div
                  className="w-12 h-12 rounded-full bg-gray-300"
                  style={{
                    backgroundImage: 'url(https://i.pravatar.cc/100?img=11)',
                    backgroundSize: 'cover',
                  }}
                />
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Stack-it Team</div>
                  <div className="text-gray-500 text-sm">
                    Founders
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sponsor CTA */}
      <section className="py-20 px-6 bg-[#e5e7eb]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <SpotlightCard className="bg-gray-900 rounded-3xl p-12 text-center relative overflow-hidden">
              <motion.div
                className="absolute inset-0 opacity-30"
                style={{
                  background:
                    'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                }}
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />

              <div className="relative z-10">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6"
                >
                  <Heart size={32} className="text-white" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Support Stack-it
                </h2>
                <p className="text-gray-400 max-w-md mx-auto mb-8">
                  Help us keep Stack-it free and open for everyone. Your
                  sponsorship enables new features and keeps the servers
                  running.
                </p>
                <Magnet strength={0.15}>
                  <button className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-2xl font-medium hover:bg-gray-100 transition-colors">
                    <Heart size={18} />
                    Become a Sponsor
                    <ChevronRight size={18} />
                  </button>
                </Magnet>
              </div>
            </SpotlightCard>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 bg-[#e5e7eb]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Ready to share your stack?
            </h2>
            <p className="text-xl text-gray-600 mb-10">
              Be one of the first to join our growing community.
            </p>
            <Magnet strength={0.15}>
              <NavLink
                to="/register"
                className="group inline-flex items-center gap-2 px-10 py-5 bg-gray-900 text-white rounded-2xl font-medium text-lg hover:bg-gray-800 transition-all hover:shadow-xl hover:shadow-gray-900/20"
              >
                Create Free Account
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </NavLink>
            </Magnet>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-300 bg-[#e5e7eb]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <img
                src="/images/black-logo.png"
                alt="Stack-it"
                className="w-8 h-8 object-contain"
              />
              <span className="font-semibold text-gray-900">Stack-it</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Code2 size={20} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <MessageSquare size={20} />
              </a>
            </div>
          </div>
          <div className="flex items-center justify-between text-gray-600 text-sm">
            <span>© 2024 Stack-it. All rights reserved.</span>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-gray-900 transition-colors">
                About
              </a>
              <a href="#" className="hover:text-gray-900 transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-gray-900 transition-colors">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
