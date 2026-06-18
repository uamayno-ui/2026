'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText, Clipboard, ShieldCheck, Bookmark, X, Check,
  Bell, ArrowRight, Link2, Route, Share2, Loader2,
} from 'lucide-react'
import type { Parcel } from '@/types/map'

const SERVICES = [
  {
    id:       'DZK',
    icon:     <FileText size={24} strokeWidth={1.5} />,
    title:    'Витяг з ДЗК',
    desc:     'Межі, площа, цільове призначення',
    price:    '100 грн',
    time:     '60 сек',
    featured: false,
  },
  {
    id:       'DRRP',
    icon:     <Clipboard size={24} strokeWidth={1.5} />,
    title:    'Витяг з ДРРП',
    desc:     'Власник, обтяження, історія операцій',
    price:    '300 грн',
    time:     '60 сек',
    featured: false,
  },
  {
    id:       'FULL',
    icon:     <ShieldCheck size={24} strokeWidth={1.5} />,
    title:    'Повний звіт',
    desc:     'ДЗК + ДРРП + AI-аналіз ризиків',
    price:    '400 грн',
    time:     '90 сек',
    featured: true,
  },
]

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-baseline gap-4 py-2.5">
      <span className="text-tiny uppercase text-gray-500 shrink-0">{label}</span>
      <span className={['text-[15px] font-medium text-right', mono ? 'font-mono' : ''].join(' ')}>{value}</span>
    </div>
  )
}

function ServiceCard({
  svc,
  loading,
  onClick,
}: {
  svc:     typeof SERVICES[number]
  loading: boolean
  onClick: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(svc.id)}
      disabled={loading}
      className="grid grid-cols-[24px_1fr_auto] gap-3.5 items-center text-left p-4 bg-white border border-gray-300 rounded cursor-pointer hover:bg-surface-soft hover:border-black transition-all duration-fast group disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="text-black">{svc.icon}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold">{svc.title}</span>
          {svc.featured && (
            <span className="text-[10px] font-medium tracking-[0.06em] uppercase px-1.5 py-0.5 bg-surface-green text-success rounded-sm">
              рек.
            </span>
          )}
        </div>
        <div className="text-[13px] text-gray-500 mt-0.5">
          {svc.desc} · <span className="font-mono">{svc.time}</span>
        </div>
      </div>
      <span className="inline-flex items-center h-[28px] px-3 rounded-full bg-green text-white text-small font-medium whitespace-nowrap">
        {svc.price}
      </span>
    </button>
  )
}

interface ParcelPanelProps {
  parcel:   Parcel
  onClose:  () => void
  onOrder:  (serviceId: string) => void
  mobile?:  boolean
}

export default function ParcelPanel({ parcel, onClose, onOrder, mobile = false }: ParcelPanelProps) {
  const router = useRouter()
  const [ordering, setOrdering] = useState<string | null>(null)
  const [copied, setCopied]     = useState(false)

  // ── Place order via API ────────────────────────────────────────────
  const handleOrder = useCallback(async (serviceId: string) => {
    setOrdering(serviceId)
    try {
      const res = await fetch('/api/order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type: serviceId, kadnum: parcel.kadnum }),
      })

      if (res.status === 401) {
        // Не авторизований -> redirect на login з поверненням на /map
        router.push(`/login?next=/map`)
        return
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error ?? 'Помилка при створенні замовлення')
        return
      }

      const data = await res.json()

      // Redirect на LiqPay checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch {
      alert('Мережева помилка. Спробуйте ще раз.')
    } finally {
      setOrdering(null)
    }
  }, [parcel.kadnum, router])

  // ── Copy link ──────────────────────────────────────────────────────
  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}/parcel/${parcel.kadnum}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [parcel.kadnum])

  const isLoading = !!ordering

  return (
    <aside className={[
      'flex flex-col bg-white overflow-hidden',
      mobile
        ? 'w-full h-full'
        : 'w-map-right flex-shrink-0 border-l border-gray-100 shadow-sm',
    ].join(' ')}>

      {/* Header */}
      <div className="flex items-center justify-between h-header px-4 md:px-6 border-b border-gray-100 flex-shrink-0">
        <span className="font-mono text-[18px] font-medium tracking-[-0.01em] truncate">
          {parcel.kadnum}
        </span>
        <div className="flex flex-shrink-0 items-center gap-1">
          <Link
            href={`/parcel/${parcel.kadnum}`}
            className="inline-flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded text-black no-underline transition-colors hover:bg-gray-100"
            aria-label="Відкрити сторінку ділянки"
            title="Відкрити сторінку ділянки"
          >
            <ArrowRight size={18} strokeWidth={1.5} />
          </Link>
          <button type="button" aria-label="Закрити" onClick={onClose} className="inline-flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded transition-colors hover:bg-gray-100">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto flex-1">

        {/* Info */}
        <section className="px-4 md:px-6 py-5 border-b border-gray-100">
          <h2 className="text-[18px] font-bold leading-snug tracking-[-0.01em] mb-1">{parcel.address}</h2>
          <p className="text-[13px] text-gray-500 mb-4">{parcel.region}</p>

          <div className="bg-surface-soft rounded px-4 py-0.5 divide-y divide-gray-100">
            <InfoRow label="Площа"      value={parcel.area}      mono />
            <InfoRow label="Цільове"    value={parcel.purpose} />
            <InfoRow label="Власність"  value={parcel.ownership} />
            <InfoRow label="Координати" value={parcel.coords}    mono />
          </div>

          <div className="flex items-center gap-1.5 mt-3 text-[12px] uppercase tracking-[0.03em] text-gray-500 font-medium">
            <Check size={14} strokeWidth={1.5} className="text-success" />
            Дані з ДЗК · оновлено 01.05.2026
          </div>
        </section>

        {/* Services */}
        <section className="px-4 md:px-6 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 font-semibold">Замовити документи</h3>
            {ordering && (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-gray-500">
                <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
                Оформлення…
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {SERVICES.map((svc) => (
              <ServiceCard
                key={svc.id}
                svc={svc}
                loading={isLoading}
                onClick={handleOrder}
              />
            ))}
          </div>
          <Link
            href="/pricing"
            className="inline-flex w-full shrink-0 items-center justify-between gap-3 whitespace-nowrap border-t border-gray-100 pt-3 mt-3 text-[14px] text-gray-500 no-underline transition-colors hover:text-black"
          >
            <span>Ще 5 послуг — НГО, план, власник, оцінка, геодезія</span>
            <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
        </section>

        {/* Actions */}
        <section className="px-4 md:px-6 py-5 border-b border-gray-100">
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { icon: <Link2 size={18} strokeWidth={1.5} />,    label: copied ? 'Скопійовано!' : 'Копіювати посилання', action: handleCopyLink },
              { icon: <Bookmark size={18} strokeWidth={1.5} />, label: 'До закладок', action: () => onOrder('bookmark') },
              { icon: <Route size={18} strokeWidth={1.5} />,    label: 'Маршрут',     action: () => {} },
              { icon: <Share2 size={18} strokeWidth={1.5} />,   label: 'Поділитись',  action: handleCopyLink },
            ].map(({ icon, label, action }) => (
              <button key={label} type="button" onClick={action} className="inline-flex h-[40px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded px-3 text-[14px] text-black transition-colors hover:bg-surface-soft">
                <span className="text-gray-500">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Monitoring promo */}
        <section className="px-4 md:px-6 py-6">
          <div className="bg-surface-green rounded p-5">
            <div className="flex gap-3 items-start mb-4">
              <Bell size={22} strokeWidth={1.5} className="text-success flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[16px] font-semibold mb-1">Стежте за змінами</h4>
                <p className="text-[14px] leading-5 text-gray-800">
                  Сповіщення про зміну власника або обтяжень.{' '}
                  <strong>19 грн/міс.</strong>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleOrder('monitor')}
              disabled={isLoading}
              className="inline-flex h-[40px] shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-green px-4 text-small font-medium text-white transition-colors hover:bg-green-hover disabled:opacity-50"
            >
              Підписатися на моніторинг
            </button>
          </div>
        </section>
      </div>
    </aside>
  )
}
