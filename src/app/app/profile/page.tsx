import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Профіль' }

export default function ProfilePage() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
      <p className="text-gray-400 text-small">Сторінка профілю — Sprint 3</p>
    </div>
  )
}
