import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Підписка' }

export default function BillingPage() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
      <p className="text-gray-400 text-small">Сторінка підписки — Sprint 3</p>
    </div>
  )
}
