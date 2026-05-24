import type { Metadata } from 'next'
import Link from 'next/link'
import {
  FileText, Clipboard, ShieldCheck, BarChart2, Map,
  Download, CheckCircle2, Clock, AlertCircle, ArrowRight, Search,
} from 'lucide-react'

export const metadata: Metadata = { title: 'Замовлення' }

// ── Types ─────────────────────────────────────────────────────────────
type OrderStatus = 'DONE' | 'PROCESSING' | 'PAID' | 'PENDING' | 'FAILED'
type OrderType   = 'DZK' | 'DRRP' | 'FULL' | 'NGO' | 'PLAN' | 'OWNER_SEARCH'

const TYPE_META: Record<OrderType, { label: string; icon: typeof FileText; price: string }> = {
  DZK:          { label: 'Витяг з ДЗК',      icon: FileText,    price: '100 грн' },
  DRRP:         { label: 'Витяг з ДРРП',     icon: Clipboard,   price: '300 грн' },
  FULL:         { label: 'Повний звіт',       icon: ShieldCheck, price: '400 грн' },
  NGO:          { label: 'НГО',               icon: BarChart2,   price: '100 грн' },
  PLAN:         { label: 'Кадастровий план',  icon: Map,         price: '100 грн' },
  OWNER_SEARCH: { label: 'Пошук власника',    icon: Search,      price: '250 грн' },
}

const STATUS_META: Record<OrderStatus, { label: string; icon: typeof CheckCircle2; cls: string; bg: string }> = {
  DONE:       { label: 'Готово',    icon: CheckCircle2, cls: 'text-green',    bg: 'bg-surface-green' },
  PAID:       { label: 'Формується', icon: Clock,       cls: 'text-gray-500', bg: 'bg-surface-soft' },
  PROCESSING: { label: 'Обробка',   icon: Clock,        cls: 'text-gray-500', bg: 'bg-surface-soft' },
  PENDING:    { label: 'Очікує',    icon: Clock,        cls: 'text-gray-400', bg: 'bg-surface-soft' },
  FAILED:     { label: 'Помилка',   icon: AlertCircle,  cls: 'text-red-500',  bg: 'bg-red-50' },
}

// ── Mock data (Sprint 3: replace with DB query) ───────────────────────
const ORDERS = [
  { id: 'ORD-1047', type: 'DRRP'  as OrderType, kadnum: '3222486200:05:002:0054', date: '2026-05-23', status: 'DONE'       as OrderStatus, price: 300 },
  { id: 'ORD-1046', type: 'DZK'   as OrderType, kadnum: '3222486200:05:002:0031', date: '2026-05-23', status: 'DONE'       as OrderStatus, price: 100 },
  { id: 'ORD-1045', type: 'FULL'  as OrderType, kadnum: '8000000000:90:004:0014', date: '2026-05-22', status: 'PROCESSING' as OrderStatus, price: 400 },
  { id: 'ORD-1044', type: 'NGO'   as OrderType, kadnum: '3222486200:05:002:0012', date: '2026-05-20', status: 'DONE'       as OrderStatus, price: 100 },
  { id: 'ORD-1043', type: 'PLAN'  as OrderType, kadnum: '3222486200:05:002:0008', date: '2026-05-19', status: 'DONE'       as OrderStatus, price: 100 },
  { id: 'ORD-1042', type: 'DRRP'  as OrderType, kadnum: '8000000000:82:046:0091', date: '2026-05-18', status: 'DONE'       as OrderStatus, price: 300 },
  { id: 'ORD-1041', type: 'DZK'   as OrderType, kadnum: '8000000000:82:046:0118', date: '2026-05-15', status: 'FAILED'     as OrderStatus, price: 100 },
  { id: 'ORD-1040', type: 'FULL'  as OrderType, kadnum: '3222486200:05:002:0042', date: '2026-05-14', status: 'DONE'       as OrderStatus, price: 400 },
]

// ── Page ──────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const total     = ORDERS.length
  const doneCount = ORDERS.filter(o => o.status === 'DONE').length
  const totalSpent = ORDERS.filter(o => o.status !== 'FAILED').reduce((s, o) => s + o.price, 0)

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] md:text-h2 font-bold tracking-[-0.02em]">Замовлення</h1>
        <Link
          href="/map"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-black text-white text-small font-medium no-underline hover:bg-black-hover transition-colors"
        >
          Нове замовлення
          <ArrowRight size={16} strokeWidth={1.5} />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Всього',          value: total },
          { label: 'Виконано',        value: doneCount },
          { label: 'Витрачено',       value: `${totalSpent} грн` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-lg border border-gray-200 px-4 py-3.5 text-center">
            <p className="text-[22px] font-bold tracking-[-0.02em] leading-none mb-1">{value}</p>
            <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Table — desktop */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-gray-100 bg-surface-soft">
                {['Тип', 'Кадастровий номер', 'Дата', 'Сума', 'Статус', ''].map((h) => (
                  <th key={h} className="text-left text-[11px] uppercase tracking-wide text-gray-400 font-medium px-5 py-3 first:pl-6 last:pr-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ORDERS.map((order) => {
                const tm = TYPE_META[order.type]
                const sm = STATUS_META[order.status]
                const Icon = tm.icon
                const StatusIcon = sm.icon
                return (
                  <tr key={order.id} className="hover:bg-surface-soft/60 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-surface-soft flex items-center justify-center flex-shrink-0">
                          <Icon size={14} strokeWidth={1.5} className="text-black" />
                        </div>
                        <span className="font-medium">{tm.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={`/parcel/${order.kadnum}`} className="font-mono text-[13px] text-gray-600 hover:text-black transition-colors no-underline">
                        {order.kadnum}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {new Date(order.date).toLocaleDateString('uk-UA')}
                    </td>
                    <td className="px-5 py-3.5 font-medium">{order.price} грн</td>
                    <td className="px-5 py-3.5">
                      <span className={['inline-flex items-center gap-1.5 text-[13px] font-medium', sm.cls].join(' ')}>
                        <StatusIcon size={13} strokeWidth={1.5} />
                        {sm.label}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {order.status === 'DONE' && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full border border-gray-300 text-[12px] font-medium text-gray-600 hover:border-black hover:text-black transition-colors"
                        >
                          <Download size={12} strokeWidth={1.5} />
                          PDF
                        </button>
                      )}
                      {order.status === 'FAILED' && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full border border-gray-300 text-[12px] font-medium text-gray-500 hover:border-black hover:text-black transition-colors"
                        >
                          Повторити
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="md:hidden divide-y divide-gray-100">
          {ORDERS.map((order) => {
            const tm = TYPE_META[order.type]
            const sm = STATUS_META[order.status]
            const Icon = tm.icon
            const StatusIcon = sm.icon
            return (
              <div key={order.id} className="flex items-start gap-3 px-4 py-3.5">
                <div className="w-8 h-8 rounded bg-surface-soft flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={14} strokeWidth={1.5} className="text-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-[14px] font-semibold">{tm.label}</span>
                    <span className="text-[14px] font-medium">{order.price} грн</span>
                  </div>
                  <p className="font-mono text-[12px] text-gray-500 truncate mb-1">{order.kadnum}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-400">{new Date(order.date).toLocaleDateString('uk-UA')}</span>
                    <span className={['inline-flex items-center gap-1 text-[12px] font-medium', sm.cls].join(' ')}>
                      <StatusIcon size={12} strokeWidth={1.5} />
                      {sm.label}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
