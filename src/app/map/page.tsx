import type { Metadata } from 'next'
import { Suspense } from 'react'
import MapClient from '@/components/map/MapClient'

export const metadata: Metadata = {
  title: 'Кадастрова мапа',
  description: 'Знайдіть земельну ділянку або об\'єкт нерухомості на кадастровій мапі України.',
}

export default function MapPage() {
  return (
    <Suspense>
      <MapClient />
    </Suspense>
  )
}
