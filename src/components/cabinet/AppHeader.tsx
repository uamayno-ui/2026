'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, LogOut, Map } from 'lucide-react'

// Sprint 3: replace with real session
const MOCK_USER = {
  name: 'Олександр Нечепуренко',
  initials: 'ОН',
  plan: 'Personal',
}

export default function AppHeader() {
  const router = useRouter()

  return (
    <header className="h-header bg-white border-b border-gray-100 flex-shrink-0 sticky top-0 z-30">
      <div className="max-w-container mx-auto px-4 md:px-8 h-full flex items-center justify-between gap-4">

        {/* Logo */}
        <Link
          href="/"
          className="text-[24px] font-bold tracking-[-0.03em] text-black no-underline leading-none"
        >
          mayno
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-2">

          {/* Map shortcut */}
          <Link
            href="/map"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-small font-medium text-gray-500 hover:bg-surface-soft hover:text-black transition-colors no-underline"
          >
            <Map size={16} strokeWidth={1.5} />
            <span className="hidden md:inline">Мапа</span>
          </Link>

          {/* Notifications */}
          <button
            type="button"
            className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-soft transition-colors text-gray-500 hover:text-black"
            aria-label="Сповіщення"
          >
            <Bell size={18} strokeWidth={1.5} />
            {/* unread dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green" />
          </button>

          {/* Plan badge */}
          <span className="hidden md:inline-flex items-center h-7 px-3 rounded-full bg-surface-soft text-tiny font-medium uppercase text-gray-500">
            {MOCK_USER.plan}
          </span>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[12px] font-bold leading-none">
              {MOCK_USER.initials}
            </span>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-soft transition-colors text-gray-400 hover:text-black"
            aria-label="Вийти"
          >
            <LogOut size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>
  )
}
