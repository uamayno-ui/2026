'use client'

import Link from 'next/link'
import { WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-surface-soft flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center mx-auto mb-6">
          <WifiOff size={22} strokeWidth={1.5} className="text-gray-400" />
        </div>

        <h1 className="text-[22px] font-bold tracking-tight mb-2">
          Немає з&apos;єднання з мережею
        </h1>
        <p className="text-[15px] text-gray-500 leading-relaxed mb-8">
          Перевірте підключення до інтернету і спробуйте знову.
          Раніше завантажені сторінки доступні в офлайн-режимі.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="shrink-0 inline-flex items-center justify-center h-11 px-6 rounded-full bg-black text-white text-[15px] font-medium hover:bg-black/80 transition-colors mb-3"
        >
          Спробувати знову
        </button>

        <div className="block">
          <Link
            href="/"
            className="text-[14px] text-gray-500 hover:text-black transition-colors no-underline"
          >
            На головну
          </Link>
        </div>
      </div>
    </div>
  )
}
