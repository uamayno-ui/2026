import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mayno.ua'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      url:              `${BASE}/`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         1.0,
    },
    {
      url:              `${BASE}/map`,
      lastModified:     now,
      changeFrequency:  'weekly',
      priority:         0.9,
    },
    {
      url:              `${BASE}/pricing`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.8,
    },
    {
      url:              `${BASE}/login`,
      lastModified:     now,
      changeFrequency:  'yearly',
      priority:         0.5,
    },
  ]
}
