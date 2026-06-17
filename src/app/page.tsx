import Link from 'next/link'
import { ArrowRight, Check, ShieldCheck, FileText, Building2, MapPin } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import Footer from '@/components/layout/Footer'
import SearchInput from '@/components/map/SearchInput'

// ---------- Trust strip ----------
const TRUST_ITEMS = [
  { icon: Check,        text: '5 000+ перевірок' },
  { icon: ShieldCheck,  text: 'Вхід через Bank ID' },
  { icon: FileText,     text: 'Дані з офіційних реєстрів' },
  { icon: Building2,    text: 'ТОВ ФАВОР АРХІТЕКТ' },
]

// ---------- How it works ----------
const HOW_STEPS = [
  {
    num: '01',
    icon: MapPin,
    title: 'Знайдіть ділянку',
    desc: 'Введіть адресу або клацніть на кадастровій мапі. Працює навіть зі скороченими адресами.',
  },
  {
    num: '02',
    icon: ShieldCheck,
    title: 'Увійдіть через ЕЦП',
    desc: 'Bank ID НБУ, Дія.Підпис, Файловий або Апаратний ключ. Безпечно через офіційний канал.',
  },
  {
    num: '03',
    icon: FileText,
    title: 'Отримайте PDF',
    desc: 'Витяг приходить на email і у ваш кабінет. Готовий до подачі нотаріусу чи в суд.',
  },
]

// ---------- What you get ----------
const FEATURES = [
  { title: 'Витяг з ДЗК',      desc: 'Межі, площа, цільове призначення, грошова оцінка' },
  { title: 'Витяг з ДРРП',     desc: 'Власник, обтяження, історія операцій' },
  { title: 'AI-аналіз ризиків', desc: 'Рейтинг угоди: зелений, жовтий або червоний' },
  { title: 'Експорт у PDF',    desc: 'Готово до нотаріуса, у суд або банку' },
]

// ---------- Pricing teaser ----------
const PLANS = [
  {
    name: 'Free',
    price: '0',
    period: 'грн',
    features: ['Перегляд карти', '3 пошуки/міс', 'PDF з вотермаркою'],
    cta: 'Спробувати',
    highlight: false,
  },
  {
    name: 'Personal',
    price: '299',
    period: 'грн/міс',
    features: ['Усе з Free', 'Безлім ДЗК', '10 ДРРП', '3 моніторинги'],
    cta: 'Обрати',
    highlight: true,
  },
  {
    name: 'Realtor',
    price: '999',
    period: 'грн/міс',
    features: ['Усе з Personal', 'Безлім ДРРП', 'Експорт у Excel', '10 моніторингів'],
    cta: 'Обрати',
    highlight: false,
  },
]

export default function HomePage() {
  return (
    <>
      <TopBar />

      <main>
        {/* ── HERO ── */}
        <section className="pt-14 pb-12 md:pt-[120px] md:pb-24 bg-white">
          <div className="max-w-container mx-auto px-4 md:px-8 text-center">
            <h1 className="text-[40px] leading-[46px] md:text-hero md:leading-[72px] font-bold tracking-[-0.02em] text-black mb-4 md:mb-6">
              Перевірте нерухомість<br />в Україні
            </h1>
            <p className="text-body md:text-h3 md:font-normal text-gray-500 mb-8 md:mb-12 max-w-[640px] mx-auto">
              За 60 секунд: ДЗК, ДРРП, аналіз ризиків. Через ЕЦП.
            </p>

            {/* Search */}
            <SearchInput />

            {/* Quick chips */}
            <div className="mt-5 flex justify-center gap-3 flex-wrap">
              <span className="inline-flex h-8 items-center px-4 rounded-full bg-surface-soft text-[13px] text-gray-500 cursor-default">
                Київ, вул. Хрещатик, 1
              </span>
              <span className="inline-flex h-8 items-center px-4 rounded-full bg-surface-soft text-[13px] text-gray-500 font-mono cursor-default">
                6310136900:12:001:0025
              </span>
              <Link
                href="/map"
                className="inline-flex h-8 shrink-0 items-center justify-center gap-1 whitespace-nowrap px-2 text-[13px] text-black underline underline-offset-2 no-underline hover:underline"
              >
                або відкрити мапу
                <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── TRUST STRIP ── */}
        <section className="border-y border-gray-100 bg-white">
          <div className="max-w-container mx-auto px-4 md:px-8 min-h-[72px] flex items-center gap-5 md:gap-8 md:justify-between overflow-x-auto no-scrollbar">
            {TRUST_ITEMS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-small text-gray-500 whitespace-nowrap shrink-0">
                <Icon size={18} strokeWidth={1.5} className="text-black" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="py-16 md:py-24 bg-surface-soft">
          <div className="max-w-container mx-auto px-4 md:px-8">
            <div className="text-center mb-10 md:mb-16">
              <h2 className="text-[28px] leading-9 md:text-h1 font-bold tracking-[-0.02em] mb-3 md:mb-4">
                Як це працює
              </h2>
              <p className="text-[15px] md:text-body-l text-gray-500">
                Три кроки до офіційного витягу. Без реєстрації, без черг.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
              {HOW_STEPS.map(({ num, icon: Icon, title, desc }) => (
                <div key={num} className="bg-white rounded p-8">
                  <div className="flex justify-between items-start mb-6">
                    <span className="font-mono text-[13px] font-medium tracking-[0.04em] text-gray-500">
                      {num}
                    </span>
                    <Icon size={24} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[24px] font-bold mb-3 tracking-[-0.01em]">{title}</h3>
                  <p className="text-[15px] leading-6 text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHAT YOU GET ── */}
        <section className="py-16 md:py-24">
          <div className="max-w-container mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center">
            {/* Text */}
            <div>
              <span className="text-tiny uppercase text-gray-500">Що ви отримаєте</span>
              <h2 className="text-[28px] leading-9 md:text-h1 font-bold tracking-[-0.02em] mt-3 mb-6 md:mb-8">
                Повний пакет даних<br />в одному PDF
              </h2>
              <div className="flex flex-col gap-5">
                {FEATURES.map(({ title, desc }) => (
                  <div key={title} className="flex gap-4 items-start">
                    <div className="flex items-center justify-center w-[28px] h-[28px] rounded-full bg-green text-white shrink-0">
                      <Check size={16} strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="text-[17px] font-semibold">{title}</div>
                      <div className="text-[15px] text-gray-500 mt-1">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PDF mockup */}
            <div className="bg-surface-blue rounded-lg p-10">
              <div className="bg-white rounded p-8 shadow-lg rotate-[-1.5deg]">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                  <span className="text-[22px] font-bold tracking-[-0.03em]">mayno</span>
                  <span className="text-tiny uppercase text-gray-500">Витяг ДЗК</span>
                </div>
                <div className="text-tiny uppercase text-gray-500 mb-1.5">Кадастровий номер</div>
                <div className="font-mono text-[18px] font-medium mb-5">2310100000:05:001:0091</div>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <div className="text-tiny uppercase text-gray-500 mb-1">Площа</div>
                    <div className="text-[18px] font-semibold">0,4218 га</div>
                  </div>
                  <div>
                    <div className="text-tiny uppercase text-gray-500 mb-1">Цільове</div>
                    <div className="text-[16px] font-medium">Для ОСГ</div>
                  </div>
                </div>
                <div className="h-20 bg-surface-soft rounded-sm" />
              </div>
            </div>
          </div>
        </section>

        {/* ── PRICING TEASER ── */}
        <section className="py-16 md:py-24 bg-surface-blue">
          <div className="max-w-container mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 md:gap-8 mb-8 md:mb-12">
              <div>
                <span className="text-tiny uppercase text-gray-500">Тарифи</span>
                <h2 className="text-[28px] leading-9 md:text-h1 font-bold tracking-[-0.02em] mt-3">
                  Платіть тільки за те,<br />що замовляєте
                </h2>
              </div>
              <Link
                href="/pricing"
                className="shrink-0 inline-flex items-center justify-center h-12 px-6 rounded-full border border-[1.5px] border-black text-black font-medium text-body no-underline hover:bg-surface-soft transition-colors whitespace-nowrap self-start md:self-auto"
              >
                Дивитись усі тарифи
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={[
                    'rounded-lg p-8',
                    plan.highlight
                      ? 'bg-black text-white'
                      : 'bg-white text-black border border-gray-300',
                  ].join(' ')}
                >
                  <div className={['text-tiny uppercase mb-4', plan.highlight ? 'text-[#A1A1AA]' : 'text-gray-500'].join(' ')}>
                    {plan.name}
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-8">
                    <span className="text-[48px] font-bold leading-none tracking-[-0.02em]">{plan.price}</span>
                    <span className={['text-body', plan.highlight ? 'text-[#A1A1AA]' : 'text-gray-500'].join(' ')}>
                      {plan.period}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-3 mb-8 list-none p-0 m-0">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-[15px]">
                        <Check
                          size={18}
                          strokeWidth={1.5}
                          className={plan.highlight ? 'text-green' : 'text-black'}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/pricing"
                    className={[
                      'inline-flex h-12 w-full shrink-0 items-center justify-center whitespace-nowrap rounded-full font-medium text-body no-underline transition-colors',
                      plan.highlight
                        ? 'bg-green text-white hover:bg-green-hover'
                        : 'border border-[1.5px] border-black hover:bg-surface-soft',
                    ].join(' ')}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DARK CTA ── */}
        <section className="bg-black text-white py-16 md:py-24">
          <div className="max-w-container mx-auto px-4 md:px-8 text-center">
            <h2 className="text-[32px] leading-10 md:text-[56px] md:leading-[64px] font-bold tracking-[-0.02em] mb-4 md:mb-6">
              Знайдіть свою нерухомість зараз
            </h2>
            <p className="text-[15px] md:text-body-l text-[#A1A1AA] mb-7 md:mb-10">
              Безкоштовний перегляд карти. Платите лише за офіційні витяги.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/map"
                className="shrink-0 inline-flex items-center justify-center h-14 px-8 rounded-full bg-green text-white font-medium text-body-l no-underline hover:bg-green-hover transition-colors"
              >
                Відкрити мапу
              </Link>
              <Link
                href="/login"
                className="shrink-0 inline-flex items-center justify-center h-14 px-8 rounded-full border border-white text-white font-medium text-body-l no-underline hover:bg-white/10 transition-colors"
              >
                Увійти через ЕЦП
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
