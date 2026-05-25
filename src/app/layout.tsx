import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import 'mapbox-gl/dist/mapbox-gl.css'
import './globals.css'
import ServiceWorkerRegister from '@/components/layout/ServiceWorkerRegister'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: {
    default: 'Mayno — перевірка нерухомості онлайн',
    template: '%s | Mayno',
  },
  description:
    'Замовте витяг з ДЗК, ДРРП, нормативну грошову оцінку та кадастровий план онлайн. Офіційні дані за 60 секунд.',
  keywords: ['витяг ДЗК', 'витяг ДРРП', 'кадастр', 'нерухомість', 'перевірка земельної ділянки'],
  authors: [{ name: 'ТОВ «ФАВОР АРХІТЕКТ»' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://mayno.ua'),
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    siteName: 'Mayno',
    title: 'Mayno — перевірка нерухомості онлайн',
    description: 'Витяг з ДЗК і ДРРП за 60 секунд. Офіційні дані реєстрів України.',
    images: [{ url: '/icons/og-default.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mayno — перевірка нерухомості онлайн',
    description: 'Витяг з ДЗК і ДРРП за 60 секунд.',
  },
  robots: { index: true, follow: true },
  // PWA
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Mayno',
  },
  formatDetection: { telephone: false },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

// Separate viewport export — required by Next.js 13+ (not part of Metadata)
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0A0A0A' },
    { media: '(prefers-color-scheme: dark)',  color: '#0A0A0A' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // prevents iOS zoom on input focus
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="uk" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
