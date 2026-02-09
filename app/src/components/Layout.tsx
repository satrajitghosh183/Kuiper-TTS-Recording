import { useLocation, Link, Outlet } from 'react-router-dom'
import { Mic, Settings, Home, LogOut, Sun, Moon, Music } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { LiquidMetalIcon } from './LiquidMetalIcon'
import { AccessibilityIndicator } from './AccessibilityIndicator'
import { AccessibilityPanel } from './AccessibilityPanel'
import { useAccessibilitySettingsContext } from '../contexts/AccessibilitySettingsContext'
import { useEffect, useState } from 'react'

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/record', icon: Mic, label: 'Record' },
  { path: '/library', icon: Music, label: 'Library' },
  { path: '/admin', icon: Settings, label: 'Admin' },
]

const springConfig = { type: 'spring' as const, stiffness: 280, damping: 18 }

export function Layout() {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const prefersReducedMotion = useReducedMotion()
  const { activeCount } = useAccessibilitySettingsContext()
  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('kuyper_theme') as 'dark' | 'light' | null
      if (stored) return stored
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    }
    return 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('kuyper_theme', theme)
  }, [theme])

  return (
    <div className="flex h-screen" style={{ background: 'var(--studio-bg-0)' }}>
      {/* Sidebar - liquid glass, physics, wider */}
      <aside className="sidebar-liquid-glass w-20 flex flex-col shrink-0 relative overflow-hidden">
        {/* Subtle accent glow */}
        <div
          className="absolute top-0 left-0 w-full h-24 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, var(--studio-accent-muted) 0%, transparent 100%)',
          }}
        />
        {/* Logo area */}
        <div
          className="h-16 flex items-center justify-center shrink-0 relative"
          style={{ borderBottom: '1px solid var(--studio-border-apple)' }}
        >
          <motion.div
            className="w-11 h-11 rounded-xl flex items-center justify-center relative"
            style={{
              background: 'linear-gradient(135deg, var(--studio-accent) 0%, var(--studio-accent-hover) 100%)',
              boxShadow: '0 4px 16px var(--studio-accent-muted), inset 0 1px 0 rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
            whileHover={!prefersReducedMotion ? { scale: 1.05 } : {}}
            whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
            transition={springConfig}
          >
            <span className="font-bold text-sm" style={{ color: 'var(--studio-bg-0)' }}>K</span>
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <ul className="space-y-2 px-3 flex flex-col items-center">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path
              return (
                <li key={path} className="w-full flex justify-center">
                  <motion.div
                    className="flex justify-center"
                    whileHover={!prefersReducedMotion ? { scale: 1.04, y: -1 } : {}}
                    whileTap={!prefersReducedMotion ? { scale: 0.96 } : {}}
                    transition={springConfig}
                  >
                    <Link
                      to={path}
                      className={`
                        w-14 h-14 rounded-xl flex items-center justify-center
                        group relative block
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--studio-bg-0)]
                        ${isActive
                          ? 'text-[var(--studio-accent)]'
                          : 'text-[var(--studio-text-1)] hover:text-[var(--studio-text-0)]'
                        }
                      `}
                      style={
                        isActive
                          ? {
                              background: 'var(--studio-accent-muted)',
                              boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.08), 0 0 20px -4px var(--studio-accent-muted)',
                              border: '1px solid var(--studio-accent)',
                            }
                          : {
                              background: 'transparent',
                              border: '1px solid transparent',
                            }
                      }
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.borderColor = 'transparent'
                        }
                      }}
                      title={label}
                    >
                      <LiquidMetalIcon size={22}>
                        <Icon size={22} strokeWidth={1.5} />
                      </LiquidMetalIcon>

                      {/* Tooltip */}
                      <span
                        className="absolute left-full ml-2 px-3 py-2 rounded-xl text-caption opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap z-50"
                        style={{
                          background: 'var(--studio-glass-strong)',
                          border: '1px solid var(--studio-border)',
                          color: 'var(--studio-text-0)',
                          boxShadow: 'var(--studio-shadow-outer)',
                        }}
                      >
                        {label}
                      </span>
                    </Link>
                  </motion.div>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Theme toggle */}
        <div className="p-2" style={{ borderTop: '1px solid var(--studio-border-apple)' }}>
          <motion.button
            type="button"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto hover:bg-[rgba(255,255,255,0.1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-accent)]"
            style={{ color: 'var(--studio-text-1)' }}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            whileHover={!prefersReducedMotion ? { scale: 1.04, y: -1 } : {}}
            whileTap={!prefersReducedMotion ? { scale: 0.96 } : {}}
            transition={springConfig}
          >
            <LiquidMetalIcon size={20}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </LiquidMetalIcon>
          </motion.button>
        </div>

        {/* User & Sign out */}
        <div className="p-2 space-y-2 shrink-0" style={{ borderTop: '1px solid var(--studio-border-apple)' }}>
          {user?.email && (
            <div className="px-2 py-1">
              <span
                className="text-micro truncate block"
                style={{ color: 'var(--studio-text-2)' }}
                title={user.email}
              >
                {user.email}
              </span>
            </div>
          )}
          <motion.button
            onClick={() => signOut()}
            className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto hover:bg-[rgba(255,255,255,0.1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-accent)]"
            style={{ color: 'var(--studio-text-1)' }}
            title="Sign out"
            whileHover={!prefersReducedMotion ? { scale: 1.04, y: -1 } : {}}
            whileTap={!prefersReducedMotion ? { scale: 0.96 } : {}}
            transition={springConfig}
          >
            <LiquidMetalIcon size={20}>
              <LogOut size={20} strokeWidth={1.5} />
            </LiquidMetalIcon>
          </motion.button>
        </div>

        {/* Version */}
        <div className="p-2 text-center">
          <span className="text-micro font-mono" style={{ color: 'var(--studio-text-2)' }}>v2.0.0</span>
        </div>
      </aside>

      {/* Accessibility - bottom right */}
      <AccessibilityIndicator
        activeCount={activeCount}
        onClick={() => setShowAccessibilityPanel(true)}
      />
      <AccessibilityPanel
        isOpen={showAccessibilityPanel}
        onClose={() => setShowAccessibilityPanel(false)}
      />

      {/* Main content */}
      <main className="flex-1 overflow-auto" style={{ background: 'var(--studio-bg-0)' }}>
        <div className="px-xl py-lg">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
