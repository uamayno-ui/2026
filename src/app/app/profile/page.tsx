import type { Metadata } from 'next'
import { User, Shield, Bell, Smartphone } from 'lucide-react'

export const metadata: Metadata = { title: 'Профіль' }

// Sprint 3: replace with getCurrentUser() from session
const MOCK_USER = {
  fullName:  'Нечепуренко Олександр Сергійович',
  rnokpp:    '••••••••••', // маскуємо в UI
  email:     'alex@mayno.ua',
  phone:     '+380 98 ••• •• 12',
  authMethod: 'Bank ID НБУ',
  plan:      'Personal',
  memberSince: '2026-04-15',
}

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">

      <h1 className="text-[22px] md:text-h2 font-bold tracking-[-0.02em]">Профіль</h1>

      {/* Identity */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <User size={16} strokeWidth={1.5} className="text-gray-500" />
          <h2 className="text-[15px] font-semibold">Особисті дані</h2>
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-green font-medium uppercase tracking-wide">
            <Shield size={11} strokeWidth={2} />
            Верифіковано
          </span>
        </div>
        <dl className="divide-y divide-gray-50">
          {[
            { label: 'ПІБ',             value: MOCK_USER.fullName },
            { label: 'РНОКПП',          value: MOCK_USER.rnokpp, mono: true },
            { label: 'Email',            value: MOCK_USER.email },
            { label: 'Телефон',          value: MOCK_USER.phone },
            { label: 'Спосіб входу',     value: MOCK_USER.authMethod },
            { label: 'Учасник з',        value: new Date(MOCK_USER.memberSince).toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' }) },
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex px-6 py-3.5 gap-4">
              <dt className="text-[13px] text-gray-500 w-40 flex-shrink-0 pt-px">{label}</dt>
              <dd className={['text-[14px] font-medium flex-1', mono ? 'font-mono' : ''].join(' ')}>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="px-6 py-4 border-t border-gray-100 bg-surface-soft">
          <p className="text-[12px] text-gray-500 leading-5">
            Дані отримані з Bank ID НБУ і захищені ЕЦП. Ми не зберігаємо ваш пароль або приватний ключ.
            Змінити ПІБ або РНОКПП можна лише через повторну верифікацію.
          </p>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Bell size={16} strokeWidth={1.5} className="text-gray-500" />
          <h2 className="text-[15px] font-semibold">Сповіщення</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { label: 'Email при готовності документа', defaultOn: true },
            { label: 'Email при змінах у моніторингу', defaultOn: true },
            { label: 'Telegram-бот сповіщення',        defaultOn: false },
            { label: 'Маркетингові листи',              defaultOn: false },
          ].map(({ label, defaultOn }) => (
            <label key={label} className="flex items-center gap-4 px-6 py-3.5 cursor-pointer hover:bg-surface-soft/50 transition-colors">
              <span className="flex-1 text-[14px]">{label}</span>
              <div className={[
                'relative w-[36px] h-[20px] rounded-full flex-shrink-0 transition-colors',
                defaultOn ? 'bg-black' : 'bg-gray-300',
              ].join(' ')}>
                <span className={[
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all',
                  defaultOn ? 'left-[18px]' : 'left-0.5',
                ].join(' ')} />
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Telegram connect */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 flex items-start gap-3">
        <div className="w-[36px] h-[36px] rounded-full bg-surface-blue flex items-center justify-center flex-shrink-0">
          <Smartphone size={16} strokeWidth={1.5} className="text-black" />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-semibold mb-1">Підключити Telegram</p>
          <p className="text-[13px] text-gray-500 mb-3">
            Отримуйте миттєві сповіщення про зміни в реєстрах прямо в Telegram.
          </p>
          <button
            type="button"
            className="shrink-0 inline-flex items-center h-[36px] px-4 rounded-full bg-black text-white text-small font-medium hover:bg-black-hover transition-colors"
          >
            Підключити →
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-[15px] font-semibold text-red-600">Небезпечна зона</h2>
        </div>
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[14px] font-medium mb-0.5">Видалити акаунт</p>
            <p className="text-[13px] text-gray-500">
              Всі ваші дані, замовлення та моніторинг будуть видалені безповоротно.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center h-[36px] px-4 rounded-full border border-red-300 text-red-600 text-small font-medium hover:bg-red-50 transition-colors whitespace-nowrap flex-shrink-0"
          >
            Видалити акаунт
          </button>
        </div>
      </div>

    </div>
  )
}
