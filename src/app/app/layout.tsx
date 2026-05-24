import type { Metadata } from 'next'
import AppSidebar from '@/components/cabinet/AppSidebar'
import AppHeader from '@/components/cabinet/AppHeader'

export const metadata: Metadata = {
  title: {
    default: 'Кабінет',
    template: '%s | Кабінет | Mayno',
  },
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-surface-soft flex flex-col">
      <AppHeader />
      <div className="flex flex-1 max-w-container mx-auto w-full px-4 md:px-8 py-6 md:py-8 gap-6 md:gap-8">
        <AppSidebar />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
