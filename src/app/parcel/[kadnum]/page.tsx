import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Ruler, Layers, FileText, Clipboard,
  ShieldCheck, BarChart2, Map, Lock, AlertCircle, ExternalLink,
} from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import Footer from '@/components/layout/Footer'

// ── helpers ──────────────────────────────────────────────────────────
function formatKadnum(raw: string) {
  // 3222486200:05:002:0054 → 3222486200:05:002:0054 (already formatted)
  return raw.replace(/%3A/gi, ':')
}

// ── mock data (Sprint 3: replace with real e.land.gov.ua fetch) ──────
function getMockParcel(kadnum: string) {
  return {
    kadnum,
    area: '0.1200 га',
    purpose: 'Для будівництва і обслуговування житлового будинку, господарських будівель і споруд',
    purposeCode: '02.01',
    category: 'Землі житлової та громадської забудови',
    ownership: 'Приватна',
    region: 'Київська область',
    district: 'Броварський район',
    settlement: 'Бровари',
    // address hidden per Закон № 4292-IX (sensitive during martial law)
    addressHidden: false,
    registeredAt: '2018-04-12',
    monetaryValue: '482 650 грн',
    hasRestrictions: false,
  }
}

// ── metadata ─────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ kadnum: string }> }
): Promise<Metadata> {
  const { kadnum } = await params
  const num = formatKadnum(kadnum)
  const parcel = getMockParcel(num)
  const desc = `Земельна ділянка ${num} — ${parcel.area}, ${parcel.category}, ${parcel.settlement}. Замовте витяг з ДЗК, ДРРП та AI-аналіз ризиків за 60 секунд.`
  return {
    title: `Ділянка ${num} — ${parcel.settlement}`,
    description: desc,
    alternates: {
      canonical: `/parcel/${num}`,
    },
    openGraph: {
      title: `Земельна ділянка ${num}`,
      description: desc,
      url: `/parcel/${num}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Земельна ділянка ${num}`,
      description: desc,
    },
  }
}

// ── service cards ─────────────────────────────────────────────────────
const SERVICES = [
  {
    icon: FileText,
    title: 'Витяг з ДЗК',
    desc: 'Межі, площа, цільове призначення, грошова оцінка',
    price: '100 грн',
    time: '60 сек',
    featured: false,
  },
  {
    icon: Clipboard,
    title: 'Витяг з ДРРП',
    desc: 'Власник, обтяження, іпотека, заборони, судові рішення',
    price: '300 грн',
    time: '60 сек',
    featured: false,
  },
  {
    icon: ShieldCheck,
    title: 'Повний звіт',
    desc: 'ДЗК + ДРРП + AI-аналіз ризиків в одному PDF',
    price: '400 грн',
    time: '90 сек',
    featured: true,
  },
  {
    icon: BarChart2,
    title: 'НГО',
    desc: 'Нормативна грошова оцінка для розрахунку податку',
    price: '100 грн',
    time: '5 хв',
    featured: false,
  },
  {
    icon: Map,
    title: 'Кадастровий план',
    desc: 'Графічна частина: межі, координати поворотних точок',
    price: '100 грн',
    time: '5 хв',
    featured: false,
  },
]

// ── page ──────────────────────────────────────────────────────────────
export default async function ParcelPage(
  { params }: { params: Promise<{ kadnum: string }> }
) {
  const { kadnum } = await params
  const num = formatKadnum(kadnum)
  const parcel = getMockParcel(num)

  // ── Schema.org JSON-LD ─────────────────────────────────────────────
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LandParcel',
    name: `Земельна ділянка ${num}`,
    description: `${parcel.category}. ${parcel.purpose}.`,
    identifier: num,
    areaServed: {
      '@type': 'AdministrativeArea',
      name: `${parcel.settlement}, ${parcel.district}, ${parcel.region}`,
      addressCountry: 'UA',
    },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Площа', value: parcel.area },
      { '@type': 'PropertyValue', name: 'Цільове призначення', value: parcel.purpose },
      { '@type': 'PropertyValue', name: 'Форма власності', value: parcel.ownership },
      { '@type': 'PropertyValue', name: 'Кадастровий номер', value: num },
    ],
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://mayno.ua'}/parcel/${num}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TopBar />
      <main>

        {/* ── BREADCRUMB ── */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-container mx-auto px-4 md:px-8 h-12 flex items-center gap-3">
            <Link
              href="/map"
              className="inline-flex items-center gap-1.5 text-small text-gray-500 hover:text-black transition-colors no-underline"
            >
              <ArrowLeft size={16} strokeWidth={1.5} />
              Повернутись на мапу
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-small text-gray-500 font-mono truncate max-w-[200px] md:max-w-none">
              {num}
            </span>
          </div>
        </div>

        {/* ── HERO ── */}
        <section className="bg-white pt-8 pb-10 md:pt-12 md:pb-14">
          <div className="max-w-container mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">

              {/* Left: title + meta */}
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 text-small text-gray-500 mb-3">
                  <MapPin size={14} strokeWidth={1.5} />
                  {parcel.settlement}, {parcel.district}
                </div>
                <h1 className="text-[28px] md:text-h1 font-bold tracking-[-0.02em] mb-2">
                  Земельна ділянка
                </h1>
                <p className="font-mono text-[18px] md:text-[22px] font-medium text-gray-500 mb-6 tracking-wide">
                  {num}
                </p>

                {/* quick stats */}
                <div className="flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 h-[36px] px-4 bg-surface-soft rounded-full text-small font-medium">
                    <Ruler size={14} strokeWidth={1.5} className="text-gray-500" />
                    {parcel.area}
                  </div>
                  <div className="inline-flex items-center gap-2 h-[36px] px-4 bg-surface-soft rounded-full text-small font-medium">
                    <Layers size={14} strokeWidth={1.5} className="text-gray-500" />
                    {parcel.category}
                  </div>
                  <div className="inline-flex items-center gap-2 h-[36px] px-4 bg-surface-soft rounded-full text-small font-medium">
                    {parcel.hasRestrictions
                      ? <AlertCircle size={14} strokeWidth={1.5} className="text-red-500" />
                      : <ShieldCheck size={14} strokeWidth={1.5} className="text-green" />
                    }
                    {parcel.hasRestrictions ? 'Є обтяження' : 'Обтяжень не виявлено'}
                  </div>
                </div>
              </div>

              {/* Right: primary CTA */}
              <div className="flex-shrink-0">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center h-14 px-8 rounded-full bg-green text-white font-medium text-body-l no-underline hover:bg-green-hover transition-colors"
                >
                  Замовити перевірку
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── CONTENT GRID ── */}
        <section className="py-10 md:py-16 bg-surface-soft">
          <div className="max-w-container mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">

              {/* ── LEFT: parcel details ── */}
              <div className="flex flex-col gap-6">

                {/* Basic info card */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-[17px] font-semibold">Основні відомості</h2>
                  </div>
                  <dl className="divide-y divide-gray-100">
                    {[
                      { label: 'Кадастровий номер', value: num, mono: true },
                      { label: 'Площа',              value: parcel.area },
                      { label: 'Цільове призначення', value: parcel.purpose },
                      { label: 'Категорія земель',    value: parcel.category },
                      { label: 'Форма власності',     value: parcel.ownership },
                      { label: 'Регіон',              value: `${parcel.region}, ${parcel.district}` },
                      { label: 'Населений пункт',     value: parcel.settlement },
                      { label: 'Дата реєстрації',     value: parcel.registeredAt },
                    ].map(({ label, value, mono }) => (
                      <div key={label} className="flex px-6 py-3.5 gap-4">
                        <dt className="text-[13px] text-gray-500 w-48 flex-shrink-0 leading-5 pt-px">{label}</dt>
                        <dd className={['text-[14px] font-medium leading-5 flex-1', mono ? 'font-mono' : ''].join(' ')}>
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Monetary value — blurred without auth */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-[17px] font-semibold">Грошова оцінка</h2>
                  </div>
                  <div className="px-6 py-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[13px] text-gray-500 mb-1">Нормативна грошова оцінка (НГО)</p>
                      <p className="text-[24px] font-bold tracking-[-0.02em]">{parcel.monetaryValue}</p>
                    </div>
                    <Link
                      href="/login"
                      className="shrink-0 inline-flex items-center gap-1.5 h-[36px] px-4 rounded-full border border-black text-small font-medium no-underline hover:bg-surface-soft transition-colors whitespace-nowrap"
                    >
                      <FileText size={14} strokeWidth={1.5} />
                      Офіційний НГО
                    </Link>
                  </div>
                </div>

                {/* Owner info — gated */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-[17px] font-semibold">Інформація про власника</h2>
                    <span className="inline-flex items-center gap-1.5 text-tiny text-gray-500">
                      <Lock size={12} strokeWidth={1.5} />
                      Потрібна авторизація
                    </span>
                  </div>
                  <div className="px-6 py-8 flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface-soft flex items-center justify-center">
                      <Lock size={20} strokeWidth={1.5} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold mb-1">Дані захищено</p>
                      <p className="text-small text-gray-500 max-w-[320px]">
                        ПІБ власника та РНОКПП доступні лише авторизованим користувачам.
                        Увійдіть через ЕЦП для перегляду.
                      </p>
                    </div>
                    <Link
                      href="/login"
                      className="shrink-0 inline-flex items-center justify-center h-[40px] px-6 rounded-full bg-black text-white text-small font-medium no-underline hover:bg-black-hover transition-colors"
                    >
                      Увійти через ЕЦП
                    </Link>
                  </div>
                </div>

                {/* Map stub */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-[17px] font-semibold">На карті</h2>
                    <Link
                      href={`/map?q=${encodeURIComponent(num)}`}
                      className="inline-flex items-center gap-1.5 text-small text-gray-500 hover:text-black transition-colors no-underline"
                    >
                      Відкрити в мапі
                      <ExternalLink size={13} strokeWidth={1.5} />
                    </Link>
                  </div>
                  <div className="h-56 bg-surface-soft flex items-center justify-center">
                    <div className="text-center">
                      <MapPin size={32} strokeWidth={1} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-small text-gray-400">
                        Інтерактивна карта доступна на{' '}
                        <Link href={`/map?q=${encodeURIComponent(num)}`} className="text-black underline">
                          сторінці мапи
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── RIGHT: order panel ── */}
              <div className="flex flex-col gap-4">

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-20">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-[17px] font-semibold">Замовити документи</h2>
                    <p className="text-[13px] text-gray-500 mt-0.5">Офіційні витяги за 60 секунд</p>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {SERVICES.map(({ icon: Icon, title, desc, price, time, featured }) => (
                      <div
                        key={title}
                        className={[
                          'px-6 py-4 flex items-start gap-3',
                          featured ? 'bg-surface-green' : '',
                        ].join(' ')}
                      >
                        <div className="w-[36px] h-[36px] rounded flex items-center justify-center bg-white border border-gray-200 flex-shrink-0">
                          <Icon size={16} strokeWidth={1.5} className="text-black" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[14px] font-semibold">{title}</span>
                            {featured && (
                              <span className="inline-flex items-center h-5 px-2 rounded-full bg-green text-white text-[10px] uppercase font-medium tracking-wide">
                                Вигідно
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] text-gray-500 leading-4 mb-2">{desc}</p>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] font-bold">{price}</span>
                              <span className="text-[11px] text-gray-400 uppercase tracking-wide">{time}</span>
                            </div>
                            <Link
                              href="/login"
                              className="shrink-0 inline-flex items-center h-[28px] px-3 rounded-full bg-black text-white text-[12px] font-medium no-underline hover:bg-black-hover transition-colors"
                            >
                              Замовити
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-6 py-4 bg-surface-soft border-t border-gray-100">
                    <p className="text-[12px] text-gray-500 leading-5">
                      Документи формуються напряму з API Держгеокадастру та НАІС.
                      Мають QR-код верифікації, приймаються нотаріусами та банками.
                    </p>
                  </div>
                </div>

                {/* Monitoring promo */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-[36px] h-[36px] rounded flex items-center justify-center bg-surface-green flex-shrink-0">
                      <ShieldCheck size={16} strokeWidth={1.5} className="text-green" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold mb-1">Моніторинг ділянки</p>
                      <p className="text-[12px] text-gray-500 leading-4 mb-3">
                        Отримуйте сповіщення при зміні власника або появі нових обтяжень.
                      </p>
                      <p className="text-[12px] font-medium">19 грн/міс за об&apos;єкт</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
