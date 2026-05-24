'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Lock, Loader2 } from 'lucide-react'

type Provider = 'bankid' | 'diia' | 'file' | 'hw'

const ALT_OPTIONS: { id: Provider; title: string; sub: string }[] = [
  { id: 'diia', title: 'Дія.Підпис',    sub: 'QR-код у застосунку Дія' },
  { id: 'file', title: 'Файловий ключ', sub: '.dat / .pfx з АЦСК' },
  { id: 'hw',   title: 'Апаратний ключ', sub: 'Алмаз-1К, IIT, Crystal-1' },
]

export default function LoginForm() {
  const [busy, setBusy] = useState<Provider | null>(null)
  const router = useRouter()

  const start = (provider: Provider) => {
    if (busy) return
    setBusy(provider)
    // TODO Sprint 3: реальний OAuth redirect
    // window.location.href = `/api/auth/${provider}`
    setTimeout(() => {
      setBusy(null)
      router.push('/app/overview')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Mini header */}
      <header className="h-header flex items-center border-b border-gray-100 bg-white">
        <div className="max-w-container mx-auto px-4 md:px-8 flex items-center justify-between w-full">
          <Link href="/" className="text-[24px] font-bold tracking-[-0.03em] text-black no-underline leading-none">
            mayno
          </Link>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-small font-medium text-black hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
            Назад
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-start md:items-center justify-center px-4 md:px-6 pt-6 pb-12 md:py-12">
        <div className="w-full max-w-[720px]">

          {/* Title */}
          <h1 className="text-[32px] leading-10 md:text-h1 font-bold tracking-[-0.02em] text-center mb-3 md:mb-4">
            Оберіть спосіб входу
          </h1>
          <p className="text-small md:text-body text-gray-500 text-center mb-7 md:mb-10">
            Авторизація через офіційні канали Дії та НБУ
          </p>

          {/* Bank ID — primary */}
          <div className="bg-surface-blue rounded-lg p-6 md:p-8 mb-5 md:mb-6">
            <div className="flex items-start justify-between gap-4 md:gap-6 mb-5 md:mb-6">
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 text-tiny uppercase text-success mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-green flex-shrink-0" />
                  Рекомендований спосіб
                </div>
                <h2 className="text-[22px] leading-7 md:text-h2 font-bold tracking-[-0.01em] mb-2">
                  Вхід через Bank ID НБУ
                </h2>
                <p className="text-small md:text-[15px] leading-5 text-gray-800">
                  Підтвердьте особу через ваш банк — Приват, Моно, Універсал, Ощад та інші.
                  Доступно усім клієнтам українських банків.
                </p>
              </div>

              {/* Bank ID logo block */}
              <div className="w-13 h-13 md:w-16 md:h-16 bg-green rounded-[10px] md:rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[10px] md:text-[11px] font-bold tracking-[0.05em] leading-tight text-center">
                  BANK<br />ID
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => start('bankid')}
              disabled={!!busy}
              className="inline-flex items-center justify-center gap-2 h-14 px-8 w-full rounded-full bg-black text-white font-medium text-body-l hover:bg-black-hover active:bg-black-press active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy === 'bankid' ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Підключення…
                </>
              ) : (
                <>
                  Увійти через Bank ID
                  <ArrowRight size={20} strokeWidth={1.5} />
                </>
              )}
            </button>
          </div>

          {/* Alternatives label */}
          <p className="text-small text-gray-500 mb-4">Інші способи входу:</p>

          {/* 3 tiles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6 md:mb-8">
            {ALT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => start(opt.id)}
                disabled={!!busy}
                className={[
                  'flex items-center md:flex-col md:items-start justify-between',
                  'h-[72px] md:h-[132px]',
                  'px-5 md:p-5 gap-4 md:gap-0',
                  'bg-white border border-[1.5px] border-black rounded',
                  'cursor-pointer hover:bg-surface-soft active:scale-[0.99] transition-all',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  busy === opt.id ? 'opacity-60' : '',
                ].join(' ')}
              >
                {/* Mobile: row layout */}
                <div className="text-left flex-1 min-w-0 md:flex-none md:w-full">
                  <div className="text-[15px] font-bold text-black leading-snug">{opt.title}</div>
                  <div className="text-[13px] text-gray-500 font-normal mt-0.5 md:hidden">{opt.sub}</div>
                </div>

                {/* Desktop: bottom row with sub + arrow */}
                <div className="hidden md:flex justify-between items-end w-full mt-auto">
                  <span className="text-[13px] text-gray-500 text-left leading-tight">{opt.sub}</span>
                  {busy === opt.id
                    ? <Loader2 size={18} className="animate-spin text-gray-500 flex-shrink-0" />
                    : <ArrowRight size={20} strokeWidth={1.5} className="flex-shrink-0" />
                  }
                </div>

                {/* Mobile arrow */}
                <div className="md:hidden flex-shrink-0">
                  {busy === opt.id
                    ? <Loader2 size={18} className="animate-spin text-gray-500" />
                    : <ArrowRight size={20} strokeWidth={1.5} />
                  }
                </div>
              </button>
            ))}
          </div>

          {/* Security note */}
          <div className="bg-surface-soft rounded flex gap-3 p-5">
            <Lock size={20} strokeWidth={1.5} className="text-gray-500 flex-shrink-0 mt-0.5" />
            <p className="text-[13px] leading-5 text-gray-500">
              Це безпечно. Вашими даними керує Bank ID НБУ або АЦСК ваших ключів —
              ми не зберігаємо логін, пароль чи приватний ключ. Авторизація відбувається
              на офіційному порталі обраного провайдера.
            </p>
          </div>

          {/* Terms */}
          <p className="mt-8 text-center text-[13px] text-gray-500">
            Натискаючи «Увійти», ви погоджуєтесь з{' '}
            <Link href="/legal/terms" className="text-black">Умовами використання</Link>
            {' '}та{' '}
            <Link href="/legal/privacy" className="text-black">Політикою приватності</Link>.
          </p>
        </div>
      </main>
    </div>
  )
}
