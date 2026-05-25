import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mayno — перевірка нерухомості',
    short_name: 'Mayno',
    description:
      'Витяг з ДЗК і ДРРП за 60 секунд. Офіційні дані реєстрів України.',
    start_url: '/map',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#FFFFFF',
    theme_color: '#0A0A0A',
    categories: ['finance', 'utilities'],
    lang: 'uk',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/icons/screenshot-wide.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Кадастрова карта Mayno',
      },
    ],
    shortcuts: [
      {
        name: 'Кадастрова карта',
        short_name: 'Карта',
        description: 'Відкрити кадастрову карту',
        url: '/map',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Мої замовлення',
        short_name: 'Замовлення',
        description: 'Переглянути замовлені документи',
        url: '/app/orders',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  }
}
