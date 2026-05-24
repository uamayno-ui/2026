'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FileText, Bell, User, CreditCard,
} from 'lucide-react'

const NAV = [
  { href: '/app/overview',    icon: LayoutDashboard, label: 'Огляд'      },
  { href: '/app/orders',      icon: FileText,        label: 'Замовлення' },
  { href: '/app/monitoring',  icon: Bell,            label: 'Моніторинг' },
  { href: '/app/profile',     icon: User,            label: 'Профіль'    },
  { href: '/app/billing',     icon: CreditCard,      label: 'Підписка'   },
]

export default function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-52 flex-shrink-0">
      <nav className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center gap-3 px-4 py-3 text-[14px] font-medium no-underline transition-colors',
                active
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:bg-surface-soft hover:text-black',
              ].join(' ')}
            >
              <Icon
                size={16}
                strokeWidth={1.5}
                className={active ? 'text-white' : 'text-gray-400'}
              />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
