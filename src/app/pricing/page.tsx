import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, FileText, Clipboard, ShieldCheck, Map, Search, BarChart2, Compass, ArrowRight } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import Footer from '@/components/layout/Footer'
import Accordion from '@/components/ui/Accordion'

export const metadata: Metadata = {
  title: 'Тарифи',
  description: 'Витяг з ДЗК — 100 грн, ДРРП — 300 грн. Підписки від 0 до 4 999 грн/міс. Платіть тільки за потрібне.',
}

// ── Plans ──────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: 'Free',
    price: '0',
    period: 'грн',
    highlight: false,
    recommended: false,
    features: [
      'Перегляд кадастрової карти',
      '3 пошуки адрес/міс',
      'PDF з вотермаркою',
    ],
    cta: 'Спробувати',
    href: '/map',
  },
  {
    name: 'Personal',
    price: '299',
    period: 'грн/міс',
    highlight: false,
    recommended: false,
    features: [
      'Усе з Free',
      'Необмежена кількість витягів ДЗК',
      '10 витягів ДРРП/міс',
      "3 об'єкти на моніторингу",
      'PDF без вотермарки',
    ],
    cta: 'Обрати Personal',
    href: '/login',
  },
  {
    name: 'Realtor',
    price: '999',
    period: 'грн/міс',
    highlight: true,
    recommended: true,
    features: [
      'Усе з Personal',
      'Необмежена кількість витягів ДРРП',
      'Експорт замовлень у Excel',
      "10 об'єктів на моніторингу",
      'Пріоритетна підтримка',
    ],
    cta: 'Обрати Realtor',
    href: '/login',
  },
  {
    name: 'Agency',
    price: '4 999',
    period: 'грн/міс',
    highlight: false,
    recommended: false,
    features: [
      'Усе з Realtor',
      'Команда до 10 користувачів',
      'Необмежена кількість ДЗК + 100 ДРРП',
      'API-доступ (beta)',
      'Виділений менеджер',
    ],
    cta: 'Обрати Agency',
    href: '/login',
  },
]

// ── Per-doc services ───────────────────────────────────────────────────
const SERVICES = [
  { icon: FileText,    title: 'Витяг з ДЗК',     desc: 'Межі, площа, цільове призначення, грошова оцінка',         price: '100 грн',       time: '60 сек' },
  { icon: Clipboard,   title: 'Витяг з ДРРП',    desc: 'Власник, обтяження, іпотека, заборони, судові рішення',    price: '300 грн',       time: '60 сек' },
  { icon: ShieldCheck, title: 'Повний звіт',      desc: 'ДЗК + ДРРП + AI-аналіз ризиків в одному PDF',              price: '400 грн',       time: '90 сек' },
  { icon: BarChart2,   title: 'НГО',              desc: 'Нормативна грошова оцінка для розрахунку податку',          price: '100 грн',       time: '5 хв'   },
  { icon: Map,         title: 'Кадастровий план', desc: 'Графічна частина: межі, координати поворотних точок',       price: '100 грн',       time: '5 хв'   },
  { icon: Search,      title: 'Пошук власника',   desc: 'Запит через нотаріальний канал. Потрібна авторизація.',     price: '250 грн',       time: '1 день' },
  { icon: BarChart2,   title: 'Експертна оцінка', desc: 'Звіт ліцензованого оцінювача, прийнятний у суді та банку', price: 'від 2 000 грн', time: '3–5 днів' },
  { icon: Compass,     title: 'Геодезія',         desc: 'Встановлення меж у натурі, виготовлення плану',             price: 'за договором',  time: '—'      },
]

// ── FAQ ────────────────────────────────────────────────────────────────
const FAQ = [
  {
    q: 'Чи офіційні ці витяги?',
    a: 'Так. Витяги формуються напряму з API Держгеокадастру (ДЗК) та НАІС (ДРРП). Документи мають QR-код верифікації і приймаються нотаріусами, банками та судами.',
  },
  {
    q: 'Як довго зберігаються замовлені PDF?',
    a: 'Відповідно до законодавства, ми зберігаємо PDF у вашому кабінеті 30 днів. Після цього документ видаляється з наших серверів — завантажте його заздалегідь.',
  },
  {
    q: "Що таке моніторинг об'єкта?",
    a: "Ми щодня перевіряємо реєстри на зміни по вашій ділянці. Якщо зміниться власник, з'явиться обтяження чи нова заборона — ви отримаєте сповіщення на email або в Telegram. Вартість 19 грн/міс за об'єкт.",
  },
  {
    q: 'Як скасувати підписку?',
    a: 'У будь-який момент через Кабінет → Підписка → Скасувати. Доступ залишається до кінця оплаченого місяця, кошти не повертаються.',
  },
  {
    q: 'Чи можна замовити витяг без підписки?',
    a: 'Так. Усі послуги доступні в разових замовленнях. Підписка потрібна лише якщо ви замовляєте більше 3–5 витягів на місяць — тоді вона вигідніша.',
  },
  {
    q: 'Які способи оплати?',
    a: 'LiqPay: Visa/Mastercard, Приват24, Apple Pay, Google Pay. Також підтримуємо Fondy. Для корпоративних клієнтів (Agency, Enterprise) — оплата за рахунком.',
  },
]

export default function PricingPage() {
  return (
    <>
      <TopBar />
      <main>

        {/* ── HERO ── */}
        <section className="pt-14 pb-10 md:pt-20 md:pb-16 bg-white text-center">
          <div className="max-w-container mx-auto px-4 md:px-8">
            <h1 className="text-[36px] leading-[42px] md:text-h1 font-bold tracking-[-0.02em] mb-4">
              Тарифи і послуги
            </h1>
            <p className="text-body md:text-body-l text-gray-500 max-w-[560px] mx-auto">
              Разові витяги або підписка — обирайте, що зручніше.
              Платіть тільки за потрібне.
            </p>
          </div>
        </section>

        {/* ── SUBSCRIPTIONS ── */}
        <section className="pb-16 md:pb-24 bg-white">
          <div className="max-w-container mx-auto px-4 md:px-8">

            {/* 4 plans */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={[
                    'relative flex flex-col rounded-lg p-6 md:p-7',
                    plan.highlight
                      ? 'bg-black text-white'
                      : 'bg-white border border-gray-300',
                  ].join(' ')}
                >
                  {plan.recommended && (
                    <span className="absolute -top-3 left-6 inline-flex items-center h-6 px-3 rounded-full bg-green text-white text-tiny uppercase">
                      Рекомендовано
                    </span>
                  )}

                  <div className={['text-tiny uppercase mb-3', plan.highlight ? 'text-[#A1A1AA]' : 'text-gray-500'].join(' ')}>
                    {plan.name}
                  </div>

                  <div className="flex items-baseline gap-1.5 mb-6">
                    <span className="text-[42px] font-bold leading-none tracking-[-0.02em]">
                      {plan.price}
                    </span>
                    <span className={['text-small', plan.highlight ? 'text-[#A1A1AA]' : 'text-gray-500'].join(' ')}>
                      {plan.period}
                    </span>
                  </div>

                  <ul className="flex flex-col gap-2.5 flex-1 mb-6 list-none p-0 m-0">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[14px] leading-5">
                        <Check
                          size={16}
                          strokeWidth={2.5}
                          className={['flex-shrink-0 mt-0.5', plan.highlight ? 'text-green' : 'text-black'].join(' ')}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.href}
                    className={[
                      'flex items-center justify-center h-11 rounded-full font-medium text-small no-underline transition-colors',
                      plan.highlight
                        ? 'bg-green text-white hover:bg-green-hover'
                        : 'border border-[1.5px] border-black text-black hover:bg-surface-soft',
                    ].join(' ')}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>

            {/* Enterprise */}
            <div className="rounded-lg border border-gray-300 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="text-tiny uppercase text-gray-500 mb-2">Enterprise</div>
                <h3 className="text-h3 font-bold mb-2">Індивідуальне рішення</h3>
                <p className="text-[15px] text-gray-500 max-w-[520px]">
                  Необмежена кількість запитів, API-інтеграція, SLA-підтримка, кастомні звіти.
                  Для великих агентств, банків і забудовників.
                </p>
              </div>
              <Link
                href="/contacts"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-black text-white font-medium text-body no-underline hover:bg-black-hover transition-colors whitespace-nowrap flex-shrink-0"
              >
                {`Зв'язатись з нами`}
                <ArrowRight size={18} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── PER-DOC SERVICES ── */}
        <section className="py-16 md:py-24 bg-surface-soft">
          <div className="max-w-container mx-auto px-4 md:px-8">
            <div className="mb-10 md:mb-14">
              <span className="text-tiny uppercase text-gray-500">Разові замовлення</span>
              <h2 className="text-[28px] leading-9 md:text-h1 font-bold tracking-[-0.02em] mt-3">
                Каталог послуг
              </h2>
              <p className="text-body text-gray-500 mt-2">
                Без підписки. Платите за кожен документ окремо.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SERVICES.map(({ icon: Icon, title, desc, price, time }) => (
                <div
                  key={title}
                  className="bg-white rounded p-5 md:p-6 flex items-start gap-4 border border-transparent hover:border-gray-300 transition-colors"
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded bg-surface-soft flex-shrink-0">
                    <Icon size={20} strokeWidth={1.5} className="text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[16px] font-semibold">{title}</span>
                      <span className="inline-flex items-center h-7 px-3 rounded-full bg-black text-white text-small font-medium whitespace-nowrap flex-shrink-0">
                        {price}
                      </span>
                    </div>
                    <p className="text-[13px] text-gray-500 mt-1 leading-5">{desc}</p>
                    <p className="text-[12px] text-gray-500 mt-1.5 uppercase tracking-wide font-medium">
                      Готовність: {time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/map"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-black text-white font-medium text-body no-underline hover:bg-black-hover transition-colors"
              >
                Замовити на мапі
                <ArrowRight size={18} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-container mx-auto px-4 md:px-8">
            <div className="max-w-[720px] mx-auto">
              <h2 className="text-[28px] leading-9 md:text-h1 font-bold tracking-[-0.02em] mb-10 md:mb-12">
                Часті запитання
              </h2>
              <Accordion items={FAQ} />
            </div>
          </div>
        </section>

        {/* ── DARK CTA ── */}
        <section className="bg-black text-white py-16 md:py-24">
          <div className="max-w-container mx-auto px-4 md:px-8 text-center">
            <h2 className="text-[32px] leading-10 md:text-[48px] md:leading-[56px] font-bold tracking-[-0.02em] mb-4 md:mb-6">
              Перевірте нерухомість зараз
            </h2>
            <p className="text-[15px] md:text-body-l text-[#A1A1AA] mb-8 md:mb-10">
              Безкоштовний перегляд карти. Перший витяг — за 60 секунд.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/map"
                className="inline-flex items-center justify-center h-14 px-8 rounded-full bg-green text-white font-medium text-body-l no-underline hover:bg-green-hover transition-colors"
              >
                Відкрити мапу
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-14 px-8 rounded-full border border-white text-white font-medium text-body-l no-underline hover:bg-white/10 transition-colors"
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
