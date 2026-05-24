import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.EMAIL_FROM ?? 'Mayno <noreply@mayno.ua>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mayno.ua'

// ── Order ready ───────────────────────────────────────────────────────
export async function sendOrderReady({
  to,
  orderType,
  kadnum,
  orderId,
  pdfExpiry,
}: {
  to: string
  orderType: string
  kadnum:    string
  orderId:   string
  pdfExpiry: Date
}) {
  const expiryStr = pdfExpiry.toLocaleDateString('uk-UA', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  await resend.emails.send({
    from:    FROM,
    to:      [to],
    subject: `✅ ${orderType} готовий — ${kadnum}`,
    html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#0A0A0A">
  <h2 style="font-size:22px;font-weight:700;margin-bottom:8px">Ваш документ готовий</h2>
  <p style="color:#6B7280;margin-bottom:24px">Кадастровий номер: <strong style="font-family:monospace;color:#0A0A0A">${kadnum}</strong></p>

  <div style="background:#F8F9FB;border-radius:8px;padding:20px;margin-bottom:24px">
    <p style="margin:0 0 4px 0;font-size:13px;color:#6B7280;text-transform:uppercase;letter-spacing:0.04em">Тип документа</p>
    <p style="margin:0;font-size:16px;font-weight:600">${orderType}</p>
  </div>

  <a href="${APP_URL}/app/orders"
     style="display:inline-block;background:#0A0A0A;color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-size:15px;font-weight:500;margin-bottom:24px">
    Завантажити PDF →
  </a>

  <p style="font-size:12px;color:#9CA3AF;border-top:1px solid #F3F4F6;padding-top:16px;margin-top:8px">
    Документ буде доступний до ${expiryStr}, після чого видаляється з наших серверів
    відповідно до вимог законодавства. Завантажте його заздалегідь.
  </p>
</div>
    `,
  })
}

// ── Monitoring alert ──────────────────────────────────────────────────
export async function sendMonitoringAlert({
  to,
  kadnum,
  changeType,
  label,
}: {
  to:         string
  kadnum:     string
  changeType: string
  label?:     string
}) {
  const title = label ?? kadnum

  const changeLabels: Record<string, string> = {
    owner_changed:      'Змінився власник',
    encumbrance_added:  "З'явилось обтяження",
    restriction_added:  "З'явилась заборона",
    mortgage_added:     "Зареєстровано іпотеку",
    area_changed:       'Змінилась площа ділянки',
  }
  const changeLabel = changeLabels[changeType] ?? 'Зафіксовано зміну в реєстрі'

  await resend.emails.send({
    from:    FROM,
    to:      [to],
    subject: `⚠️ ${changeLabel} — ${title}`,
    html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#0A0A0A">
  <div style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:8px;padding:16px 20px;margin-bottom:24px">
    <p style="margin:0;font-weight:600;color:#92400E">⚠️ ${changeLabel}</p>
  </div>

  <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">${title}</h2>
  <p style="font-family:monospace;color:#6B7280;font-size:13px;margin-bottom:24px">${kadnum}</p>

  <p style="color:#374151;margin-bottom:24px">
    Моніторинг Mayno зафіксував зміну в реєстрі для вашої ділянки.
    Рекомендуємо замовити актуальний витяг з ДРРП, щоб перевірити деталі.
  </p>

  <a href="${APP_URL}/parcel/${kadnum}"
     style="display:inline-block;background:#22C55E;color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-size:15px;font-weight:500;margin-bottom:24px">
    Переглянути ділянку →
  </a>

  <p style="font-size:12px;color:#9CA3AF;border-top:1px solid #F3F4F6;padding-top:16px">
    Сповіщення надіслано системою моніторингу Mayno. Управляти підпискою:
    <a href="${APP_URL}/app/monitoring" style="color:#0A0A0A">${APP_URL}/app/monitoring</a>
  </p>
</div>
    `,
  })
}

// ── Welcome email ─────────────────────────────────────────────────────
export async function sendWelcome({ to, name }: { to: string; name: string }) {
  const firstName = name.split(' ')[1] ?? name // ПІБ → ім'я

  await resend.emails.send({
    from:    FROM,
    to:      [to],
    subject: `Ласкаво просимо до Mayno, ${firstName}!`,
    html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#0A0A0A">
  <h2 style="font-size:22px;font-weight:700;margin-bottom:8px">Вітаємо, ${firstName}!</h2>
  <p style="color:#6B7280;margin-bottom:24px">
    Ваш акаунт Mayno створено та верифіковано через Bank ID НБУ.
  </p>

  <div style="background:#F8F9FB;border-radius:8px;padding:20px;margin-bottom:24px">
    <p style="margin:0 0 12px 0;font-weight:600">Що можна зробити зараз:</p>
    <ul style="margin:0;padding-left:20px;color:#374151;line-height:1.8">
      <li>Знайти ділянку на <a href="${APP_URL}/map" style="color:#0A0A0A">кадастровій карті</a></li>
      <li>Замовити витяг з ДЗК за 100 грн за 60 секунд</li>
      <li>Увімкнути моніторинг змін в реєстрах</li>
    </ul>
  </div>

  <a href="${APP_URL}/map"
     style="display:inline-block;background:#0A0A0A;color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-size:15px;font-weight:500">
    Відкрити карту →
  </a>
</div>
    `,
  })
}
