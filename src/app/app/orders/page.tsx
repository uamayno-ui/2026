import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Замовлення' }

export default function OrdersPage() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
      <p className="text-gray-400 text-small">Сторінка замовлень — Sprint 3</p>
    </div>
  )
}
