import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, CreditCard, ArrowRight, TrendingUp } from 'lucide-react'

export const metadata: Metadata = { title: 'Підписка' }

const PLANS = [
  {
    name: 'Free',       price: 0,
    features: ['Перегляд карти', '3 пошуки/міс', 'PDF з вотермаркою'],
  },
  {
    name: 'Personal',   price: 299,
    features: ['Необмежені витяги ДЗК', '10 витягів ДРРП/міс', "3 об'єкти моніторингу", 'PDF без вотермарки'],
  },
  {
    name: 'Realtor',    price: 999,
    features: ['Необмежені витяги ДРРП', 'Експорт у Excel', "10 об'єктів моніторингу", 'Пріоритетна підтримка'],
  },
  {
    name: 'Agency',     price: 4999,
    features: ['Команда до 10 користувачів', 'API-доступ (beta)', 'Виділений менеджер'],
  },
]

const CURRENT_PLAN = 'Personal'
const PLAN_EXPIRES = '2026-06-24'

// Mock invoice history
const INVOICES = [
  { id: 'INV-2026-05', date: '2026-05-01', amount: 299, status: 'Оплачено', plan: 'Personal' },
  { id: 'INV-2026-04', date: '2026-04-01', amount: 299, status: 'Оплачено', plan: 'Personal' },
  { id: 'INV-2026-03', date: '2026-03-01', amount: 299, status: 'Оплачено', plan: 'Personal' },
]

export default function BillingPage() {
  return (
    <div className="flex flex-col gap-6">

      <h1 className="text-[22px] md:text-h2 font-bold tracking-[-0.02em]">Підписка та оплата</h1>

      {/* Current plan */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Поточний тариф</h2>
          <span className="inline-flex items-center h-6 px-3 rounded-full bg-black text-white text-[11px] font-semibold uppercase tracking-wide">
            {CURRENT_PLAN}
          </span>
        </div>
        <div className="px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[28px] font-bold tracking-[-0.02em] mb-1">299 <span className="text-[16px] font-normal text-gray-500">грн/міс</span></p>
            <p className="text-[13px] text-gray-500">
              Наступне списання: <span className="text-black font-medium">{new Date(PLAN_EXPIRES).toLocaleDateString('uk-UA')}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/pricing"
              className="shrink-0 inline-flex items-center gap-1.5 h-[40px] px-5 rounded-full bg-green text-white text-small font-medium no-underline hover:bg-green-hover transition-colors"
            >
              <TrendingUp size={15} strokeWidth={1.5} />
              Підвищити план
            </Link>
            <button
              type="button"
              className="shrink-0 inline-flex items-center h-[40px] px-4 rounded-full border border-gray-300 text-small font-medium text-gray-600 hover:border-black hover:text-black transition-colors"
            >
              Скасувати
            </button>
          </div>
        </div>
      </div>

      {/* Plan comparison */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-[15px] font-semibold">Порівняння тарифів</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
          {PLANS.map((plan) => {
            const isCurrent = plan.name === CURRENT_PLAN
            return (
              <div key={plan.name} className={['p-5 flex flex-col', isCurrent ? 'bg-surface-soft' : ''].join(' ')}>
                <div className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-1">{plan.name}</div>
                <div className="text-[22px] font-bold tracking-[-0.02em] mb-4 leading-none">
                  {plan.price === 0 ? 'Безкоштовно' : `${plan.price} грн`}
                </div>
                <ul className="flex flex-col gap-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[12px] leading-4">
                      <Check size={12} strokeWidth={2.5} className="text-green flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  {isCurrent ? (
                    <span className="text-[12px] text-green font-semibold">✓ Ваш план</span>
                  ) : plan.price > 299 ? (
                    <Link href="/pricing" className="text-[12px] text-gray-500 hover:text-black transition-colors no-underline flex items-center gap-1">
                      Обрати <ArrowRight size={11} strokeWidth={1.5} />
                    </Link>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Payment method */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <CreditCard size={16} strokeWidth={1.5} className="text-gray-500" />
          <h2 className="text-[15px] font-semibold">Спосіб оплати</h2>
        </div>
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-[40px] h-[28px] bg-surface-soft border border-gray-200 rounded flex items-center justify-center">
              <span className="text-[10px] font-bold text-gray-600">VISA</span>
            </div>
            <div>
              <p className="text-[14px] font-medium">•••• •••• •••• 4242</p>
              <p className="text-[12px] text-gray-400">Expires 08/27</p>
            </div>
          </div>
          <button
            type="button"
            className="text-[13px] text-gray-500 hover:text-black transition-colors"
          >
            Змінити
          </button>
        </div>
        <div className="px-6 pb-5">
          <p className="text-[12px] text-gray-400">
            Оплата через LiqPay. Картка зберігається у зашифрованому вигляді на серверах LiqPay.
            Mayno не зберігає реквізити картки.
          </p>
        </div>
      </div>

      {/* Invoice history */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-[15px] font-semibold">Історія платежів</h2>
        </div>
        <table className="w-full text-[14px]">
          <thead>
            <tr className="border-b border-gray-100 bg-surface-soft">
              {['Рахунок', 'Дата', 'Тариф', 'Сума', 'Статус'].map((h) => (
                <th key={h} className="text-left text-[11px] uppercase tracking-wide text-gray-400 font-medium px-6 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {INVOICES.map((inv) => (
              <tr key={inv.id} className="hover:bg-surface-soft/50 transition-colors">
                <td className="px-6 py-3.5 font-mono text-[13px] text-gray-600">{inv.id}</td>
                <td className="px-6 py-3.5 text-gray-500">{new Date(inv.date).toLocaleDateString('uk-UA')}</td>
                <td className="px-6 py-3.5">{inv.plan}</td>
                <td className="px-6 py-3.5 font-medium">{inv.amount} грн</td>
                <td className="px-6 py-3.5">
                  <span className="inline-flex items-center gap-1 text-[13px] font-medium text-green">
                    <Check size={12} strokeWidth={2.5} />
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
