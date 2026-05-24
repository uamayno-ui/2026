'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, User } from 'lucide-react'

const NAV_LINKS = [
  { href: '/map',     label: 'Мапа' },
  { href: '/pricing', label: 'Тарифи' },
  { href: '/how',     label: 'Як працює' },
]

interface TopBarProps {
  isLoggedIn?: boolean
}

export default function TopBar({ isLoggedIn = false }: TopBarProps) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const navLinkClass = (href: string) =>
    [
      'text-[15px] font-medium transition-colors duration-fast no-underline',
      pathname === href ? 'text-black' : 'text-gray-500 hover:text-black',
    ].join(' ')

  return (
    <>
      <header className="sticky top-0 z-50 h-header bg-white border-b border-gray-100">
        <div className="max-w-container mx-auto h-full flex items-center justify-between px-4 md:px-8">

          {/* Desktop layout */}
          <div className="hidden md:flex items-center gap-10 w-full">
            <div className="flex items-center gap-10 flex-1">
              <Link href="/" className="text-[24px] font-bold tracking-[-0.03em] text-black no-underline leading-none">
                mayno
              </Link>
              <nav className="flex items-center gap-7">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link key={href} href={href} className={navLinkClass(href)}>
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <Link
                  href="/app/overview"
                  className="inline-flex items-center gap-2 h-10 px-4 text-small font-medium rounded-full text-black no-underline hover:bg-gray-100 transition-colors duration-fast"
                >
                  <User size={20} strokeWidth={1.5} />
                  Кабінет
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center h-10 px-4 text-small font-medium rounded-full bg-black text-white no-underline hover:bg-black-hover transition-colors duration-fast"
                >
                  Увійти
                </Link>
              )}
            </div>
          </div>

          {/* Mobile layout */}
          <div className="flex md:hidden items-center justify-between w-full relative">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="p-2 -ml-2 rounded hover:bg-gray-100 transition-colors"
              aria-label="Меню"
            >
              <Menu size={24} strokeWidth={1.5} />
            </button>

            <Link
              href="/"
              className="text-[22px] font-bold tracking-[-0.03em] text-black no-underline absolute left-1/2 -translate-x-1/2"
            >
              mayno
            </Link>

            {isLoggedIn ? (
              <Link href="/app/overview" aria-label="Кабінет" className="p-2 -mr-2 rounded hover:bg-gray-100 transition-colors no-underline">
                <User size={24} strokeWidth={1.5} />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-8 px-3 text-small font-medium rounded-full bg-black text-white no-underline"
              >
                Увійти
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="absolute top-0 left-0 bottom-0 w-[280px] bg-white px-6 py-4 flex flex-col gap-1 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between h-12 mb-4">
              <span className="text-[22px] font-bold tracking-[-0.03em]">mayno</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-2 -mr-2 rounded hover:bg-gray-100 transition-colors"
                aria-label="Закрити"
              >
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setDrawerOpen(false)}
                className={[navLinkClass(href), 'py-3'].join(' ')}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
