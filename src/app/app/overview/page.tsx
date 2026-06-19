import type { Metadata } from 'next'
import Link from 'next/link'
import {
  FileText, Clipboard, ShieldCheck, BarChart2, Map, ArrowRight,
  CheckCircle2, Clock, AlertCircle, TrendingUp,
} from 'lucide-react'

export const metadata: Metadata = { title: 'Огляд' }

// ── mock data (Sprint 3: replace with real DB queries) ────────────────
const MOCK_USER = { name: 'Демо-користувач' }

const STATS = [
  { label: 'Демо-замовлень', value: '7',  sub: 'Приклад статистики',  color: 'text-black'  },
  { label: 'Прикладів в обробці', value: '2',  sub: 'Не реальні замовлення', color: 'text-black'  },
  { label: 'Демо-моніторингів', value: '3', sub: 'Приклад вигляду кабінету', color: 'text-black'  },
  { label: 'Демо-витрати', value: '1 900 грн', sub: 'Не платіжні дані', color: 'text-black' },
]

const RECENT_ORDERS = [
  {
    id: 'DEMO-1047',
    type: 'Витяг з ДРРП',
    icon: Clipboard,
    kadnum: '0000000000:00:000:0001',
    date: '2026-05-23',
    price: '300 грн',
    status: 'done',
  },
  {
    id: 'DEMO-1046',
    type: 'Витяг з ДЗК',
    icon: FileText,
    kadnum: '0000000000:00:000:0002',
    date: '2026-05-23',
    price: '100 грн',
    status: 'done',
  },
  {
    id: 'DEMO-1045',
    type: 'Повний звіт',
    icon: ShieldCheck,
    kadnum: '0000000000:00:000:0003',
    date: '2026-05-22',
    price: '400 грн',
    status: 'processing',
  },
  {
    id: 'DEMO-1044',
    type: 'НГО',
    icon: BarChart2,
    kadnum: '0000000000:00:000:0004',
    date: '2026-05-20',
    price: '100 грн',
    status: 'done',
  },
  {
    id: 'DEMO-1043',
    type: 'Кадастровий план',
    icon: Map,
    kadnum: '0000000000:00:000:0005',
    date: '2026-05-19',
    price: '100 грн',
    status: 'done',
  },
]

const STATUS_MAP: Record<string, { label: string; icon: typeof CheckCircle2; cls: string }> = {
  done:       { label: 'Готово',    icon: CheckCircle2, cls: 'text-green' },
  processing: { label: 'Обробка',   icon: Clock,        cls: 'text-gray-400' },
  error:      { label: 'Помилка',   icon: AlertCircle,  cls: 'text-red-500' },
}

const QUICK_ACTIONS = [
  { label: 'Витяг з ДЗК',   price: '100 грн', icon: FileText,    href: '/map' },
  { label: 'Витяг з ДРРП',  price: '300 грн', icon: Clipboard,   href: '/map' },
  { label: 'Повний звіт',   price: '400 грн', icon: ShieldCheck, href: '/map', featured: true },
]

// ── page ──────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const today = new Date().toLocaleDateString('uk-UA', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="flex flex-col gap-6">

      {/* ── GREETING ── */}
      <div>
        <p className="text-small text-gray-500 mb-1">{today}</p>
        <h1 className="text-[26px] md:text-h2 font-bold tracking-[-0.02em]">
          Демо-кабінет
        </h1>
        <p className="text-small text-gray-500 mt-1">
          Приклад вигляду кабінету. Реальні дані зʼявляться після авторизації та підключення API.
        </p>
      </div>

      {/* ── STATS GRID ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map(({ label, value, sub }) => (
          <div key={label} className="bg-white rounded-lg border border-gray-200 px-5 py-4">
            <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-2 font-medium">{label}</p>
            <p className="text-[28px] font-bold tracking-[-0.02em] leading-none mb-1">{value}</p>
            <p className="text-[12px] text-gray-400 leading-4">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── QUICK ORDER ── */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-[17px] font-semibold">Швидке замовлення</h2>
            <p className="text-[12px] text-gray-500 mt-0.5">Демо-дані</p>
          </div>
          <Link
            href="/map"
            className="inline-flex items-center gap-1 text-small text-gray-500 hover:text-black transition-colors no-underline"
          >
            Відкрити мапу
            <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {QUICK_ACTIONS.map(({ label, price, icon: Icon, href, featured }) => (
            <Link
              key={label}
              href={href}
              className={[
                'flex items-center justify-between p-4 rounded-lg border no-underline transition-colors group',
                featured
                  ? 'border-green bg-surface-green hover:bg-green/10'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-surface-soft',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                <div className={[
                  'w-[36px] h-[36px] rounded flex items-center justify-center flex-shrink-0',
                  featured ? 'bg-green/10' : 'bg-surface-soft',
                ].join(' ')}>
                  <Icon size={16} strokeWidth={1.5} className={featured ? 'text-green' : 'text-black'} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-black">{label}</p>
                  <p className="text-[12px] text-gray-500">{price}</p>
                </div>
              </div>
              <ArrowRight size={16} strokeWidth={1.5} className="text-gray-400 group-hover:text-black transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── RECENT ORDERS ── */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-[17px] font-semibold">Демо-замовлення</h2>
            <p className="text-[12px] text-gray-500 mt-0.5">Це приклади, не реальні документи.</p>
          </div>
          <Link
            href="/app/orders"
            className="inline-flex items-center gap-1 text-small text-gray-500 hover:text-black transition-colors no-underline"
          >
            Всі замовлення
            <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-gray-100 bg-surface-soft">
                <th className="text-left text-[11px] uppercase tracking-wide text-gray-400 font-medium px-6 py-3">Тип</th>
                <th className="text-left text-[11px] uppercase tracking-wide text-gray-400 font-medium px-4 py-3">Кадастровий номер</th>
                <th className="text-left text-[11px] uppercase tracking-wide text-gray-400 font-medium px-4 py-3">Дата</th>
                <th className="text-left text-[11px] uppercase tracking-wide text-gray-400 font-medium px-4 py-3">Вартість</th>
                <th className="text-left text-[11px] uppercase tracking-wide text-gray-400 font-medium px-6 py-3">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {RECENT_ORDERS.map((order) => {
                const Icon = order.icon
                const st = STATUS_MAP[order.status]
                const StatusIcon = st.icon
                return (
                  <tr key={order.id} className="hover:bg-surface-soft/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-[28px] h-[28px] rounded bg-surface-soft flex items-center justify-center flex-shrink-0">
                          <Icon size={14} strokeWidth={1.5} className="text-black" />
                        </div>
                        <span className="font-medium">{order.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[13px] text-gray-600">{order.kadnum}</span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500">
                      {new Date(order.date).toLocaleDateString('uk-UA')}
                    </td>
                    <td className="px-4 py-3.5 font-medium">{order.price}</td>
                    <td className="px-6 py-3.5">
                      <span className={['inline-flex items-center gap-1.5 text-[13px] font-medium', st.cls].join(' ')}>
                        <StatusIcon size={14} strokeWidth={1.5} />
                        {st.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="md:hidden divide-y divide-gray-100">
          {RECENT_ORDERS.map((order) => {
            const Icon = order.icon
            const st = STATUS_MAP[order.status]
            const StatusIcon = st.icon
            return (
              <div key={order.id} className="flex items-start gap-3 px-4 py-3.5">
                <div className="w-[32px] h-[32px] rounded bg-surface-soft flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={14} strokeWidth={1.5} className="text-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-[14px] font-semibold">{order.type}</span>
                    <span className="text-[14px] font-medium">{order.price}</span>
                  </div>
                  <p className="font-mono text-[12px] text-gray-500 truncate mb-1">{order.kadnum}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-400">
                      {new Date(order.date).toLocaleDateString('uk-UA')}
                    </span>
                    <span className={['inline-flex items-center gap-1 text-[12px] font-medium', st.cls].join(' ')}>
                      <StatusIcon size={12} strokeWidth={1.5} />
                      {st.label}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── UPGRADE BANNER (if on Free) ── */}
      <div className="bg-black text-white rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-[40px] h-[40px] rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={20} strokeWidth={1.5} className="text-green" />
          </div>
          <div>
            <p className="text-[15px] font-semibold mb-1">Перейдіть на Realtor</p>
            <p className="text-[13px] text-[#A1A1AA] max-w-[400px]">
              Необмежена кількість витягів ДРРП, 10 об&apos;єктів на моніторингу і пріоритетна підтримка за 999 грн/міс.
            </p>
          </div>
        </div>
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-green text-white font-medium text-small no-underline hover:bg-green-hover transition-colors whitespace-nowrap flex-shrink-0"
        >
          Порівняти тарифи
          <ArrowRight size={16} strokeWidth={1.5} />
        </Link>
      </div>

    </div>
  )
}
