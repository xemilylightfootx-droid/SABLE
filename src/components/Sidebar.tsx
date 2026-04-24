'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, FolderOpen, Wand2, Settings } from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { href: '/',           label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/templates',  label: 'Templates',   icon: FileText },
  { href: '/documents',  label: 'Documents',   icon: FolderOpen },
  { href: '/fill',       label: 'Fill & Generate', icon: Wand2 },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-navy-800 text-slate-300 h-screen">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-navy-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <Wand2 size={16} className="text-white" />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">SABLE</span>
        </div>
        <p className="text-xs text-slate-500 mt-1.5 leading-tight">Smart contract automation</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-navy-700'
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-navy-700 pt-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-white hover:bg-navy-700 transition-colors"
        >
          <Settings size={17} />
          Settings
        </Link>
        <p className="text-xs text-slate-600 px-3 mt-3">v0.1.0</p>
      </div>
    </aside>
  )
}
