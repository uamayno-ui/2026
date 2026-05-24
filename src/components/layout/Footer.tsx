import Link from 'next/link'

const FOOTER_LINKS = [
  {
    title: 'Продукт',
    items: [
      { label: 'Мапа', href: '/map' },
      { label: 'Каталог послуг', href: '/pricing' },
      { label: 'Моніторинг', href: '/app/monitoring' },
    ],
  },
  {
    title: 'Тарифи',
    items: [
      { label: 'Personal', href: '/pricing' },
      { label: 'Realtor', href: '/pricing' },
      { label: 'Agency', href: '/pricing' },
    ],
  },
  {
    title: 'Компанія',
    items: [
      { label: 'Про нас', href: '/about' },
      { label: 'Блог', href: '/blog' },
      { label: 'Контакти', href: '/contacts' },
    ],
  },
  {
    title: 'Юридичне',
    items: [
      { label: 'Угода', href: '/legal/terms' },
      { label: 'Privacy', href: '/legal/privacy' },
      { label: 'Реквізити', href: '/legal/requisites' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white mt-24 md:mt-24">
      <div className="max-w-container mx-auto px-4 md:px-8 py-10 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-8 mb-8 md:mb-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="text-[24px] font-bold tracking-[-0.03em] mb-3">mayno</div>
            <p className="text-small text-gray-500 leading-relaxed max-w-[280px]">
              Український сервіс перевірки нерухомості. ДЗК і ДРРП за 60 секунд.
            </p>
          </div>

          {/* Nav columns */}
          {FOOTER_LINKS.map(({ title, items }) => (
            <div key={title}>
              <div className="text-tiny uppercase text-gray-500 mb-4">{title}</div>
              <div className="flex flex-col gap-3">
                {items.map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="text-small text-black no-underline hover:underline"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row gap-3 justify-between text-[13px] text-gray-500">
          <span>© 2026 ТОВ «ФАВОР АРХІТЕКТ» · ЄДРПОУ 42341537</span>
          <span>Дані з офіційних реєстрів України · ДЗК · ДРРП</span>
        </div>
      </div>
    </footer>
  )
}
