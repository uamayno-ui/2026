import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, Bell, BellOff, ArrowRight, AlertCircle, CheckCircle2, Plus } from 'lucide-react'

export const metadata: Metadata = { title: 'Моніторинг' }

// ── Mock data ─────────────────────────────────────────────────────────
const OBJECTS = [
  {
    id: 'm1',
    kadnum: '3222486200:05:002:0054',
    label: 'Бровари — житлова',
    lastChecked: '2026-05-24',
    lastChanged: null,
    status: 'ok' as const,
    alerts: 0,
    paidUntil: '2026-06-24',
  },
  {
    id: 'm2',
    kadnum: '8000000000:90:004:0014',
    label: 'Київ, Печерськ',
    lastChecked: '2026-05-24',
    lastChanged: '2026-05-20',
    status: 'changed' as const,
    alerts: 1,
    paidUntil: '2026-06-24',
  },
  {
    id: 'm3',
    kadnum: '3222486200:05:002:0031',
    label: null,
    lastChecked: '2026-05-23',
    lastChanged: null,
    status: 'ok' as const,
    alerts: 0,
    paidUntil: '2026-06-05',
  },
]

const PLAN_LIMIT = 3 // Personal plan

// ── Page ──────────────────────────────────────────────────────────────
export default function MonitoringPage() {
  const activeCount = OBJECTS.length

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] md:text-h2 font-bold tracking-[-0.02em]">Моніторинг</h1>
        <Link
          href="/map"
          className="shrink-0 inline-flex items-center gap-2 h-[40px] px-5 rounded-full bg-black text-white text-small font-medium no-underline hover:bg-black-hover transition-colors"
        >
          <Plus size={16} strokeWidth={1.5} />
          Додати
        </Link>
      </div>

      {/* Limit bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[14px] font-semibold mb-0.5">
            Об&apos;єктів на моніторингу: <span className="text-black">{activeCount} / {PLAN_LIMIT}</span>
          </p>
          <p className="text-[13px] text-gray-500">19 грн/міс за об&apos;єкт · Personal план</p>
        </div>
        <div className="w-36 h-2 bg-surface-soft rounded-full overflow-hidden flex-shrink-0">
          <div
            className="h-full bg-black rounded-full transition-all"
            style={{ width: `${(activeCount / PLAN_LIMIT) * 100}%` }}
          />
        </div>
      </div>

      {/* Objects list */}
      <div className="flex flex-col gap-3">
        {OBJECTS.map((obj) => (
          <div key={obj.id} className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">

                {/* Status icon */}
                <div className={[
                  'w-[36px] h-[36px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                  obj.status === 'changed' ? 'bg-warning/10' : 'bg-surface-green',
                ].join(' ')}>
                  {obj.status === 'changed'
                    ? <AlertCircle size={16} strokeWidth={1.5} className="text-warning" />
                    : <CheckCircle2 size={16} strokeWidth={1.5} className="text-green" />
                  }
                </div>

                <div className="min-w-0">
                  {obj.label && (
                    <p className="text-[14px] font-semibold mb-0.5">{obj.label}</p>
                  )}
                  <Link
                    href={`/parcel/${obj.kadnum}`}
                    className="font-mono text-[13px] text-gray-500 hover:text-black transition-colors no-underline"
                  >
                    {obj.kadnum}
                  </Link>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {obj.alerts > 0 && (
                  <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-warning/10 text-warning text-[11px] font-semibold">
                    {obj.alerts} зміна
                  </span>
                )}
                <button
                  type="button"
                  className="w-[32px] h-[32px] flex items-center justify-center rounded-full hover:bg-surface-soft transition-colors text-gray-400 hover:text-black"
                  title="Вимкнути сповіщення"
                >
                  <Bell size={15} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Details */}
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-3 gap-3 text-[13px]">
              <div>
                <p className="text-gray-400 text-[11px] uppercase tracking-wide mb-0.5">Остання перевірка</p>
                <p className="font-medium">{new Date(obj.lastChecked).toLocaleDateString('uk-UA')}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[11px] uppercase tracking-wide mb-0.5">Остання зміна</p>
                <p className={['font-medium', obj.lastChanged ? 'text-warning' : 'text-gray-400'].join(' ')}>
                  {obj.lastChanged
                    ? new Date(obj.lastChanged).toLocaleDateString('uk-UA')
                    : 'Змін не виявлено'
                  }
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-[11px] uppercase tracking-wide mb-0.5">Оплачено до</p>
                <p className="font-medium">{new Date(obj.paidUntil).toLocaleDateString('uk-UA')}</p>
              </div>
            </div>

            {/* Changed alert */}
            {obj.status === 'changed' && (
              <div className="mt-3 flex items-center justify-between bg-warning/10 rounded px-4 py-3 gap-4">
                <p className="text-[13px] text-warning font-medium">
                  Зафіксовано зміну в реєстрі 20.05.2026. Замовте актуальний витяг.
                </p>
                <Link
                  href={`/parcel/${obj.kadnum}`}
                  className="inline-flex items-center gap-1 h-[32px] px-3 rounded-full bg-black text-white text-[12px] font-medium no-underline hover:bg-black-hover transition-colors whitespace-nowrap flex-shrink-0"
                >
                  Переглянути
                  <ArrowRight size={13} strokeWidth={1.5} />
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 flex gap-3">
        <ShieldCheck size={18} strokeWidth={1.5} className="text-green flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[14px] font-semibold mb-1">Як працює моніторинг</p>
          <p className="text-[13px] text-gray-500 leading-5">
            Щодня перевіряємо ДРРП і ДЗК на зміни. При появі нового обтяження, іпотеки,
            заборони чи зміни власника — надсилаємо сповіщення на email і Telegram.
          </p>
        </div>
      </div>
    </div>
  )
}
