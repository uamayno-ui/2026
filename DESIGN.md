# Mayno — DESIGN.md

> **Єдиний source of truth для розробки.** Передай цей файл Codex / Claude Code разом із репозиторієм дизайн-системи. Тут усе: продукт, стек, дизайн-токени, компоненти, специфікація кожного екрана, копірайт, мапа, чек-листи.
>
> **Еталонна реалізація живе в `ui_kits/web/`** (React + Babel-standalone, inline-styles). Звіряйся з нею покомпонентно. Production-код пиши на своєму стеку (Next.js/React + CSS-modules/Tailwind), але **візуал має збігатися піксель-у-піксель**.

---

## 0. TL;DR для агента

1. Шрифт **Inter** (UI) + **JetBrains Mono** (тільки кадастрові номери/координати/ID).
2. Палітра: чорний `#0A0A0A`, білий, **зелений `#22C55E` — єдиний акцент** (Bank ID green, тільки головні позитивні дії). 3 surface-фони, 4 status, 4 нейтралі. **Без помаранчевого, navy, градієнтів, тризуба, синьо-жовтого.**
3. Радіус **8px** скрізь; **pill (999px) тільки на кнопках**.
4. Кнопки ЗАВЖДИ з фіксованою висотою (48/40/32/56) + `flex:none`; flex-батько `align-items:center`. (Це фікс №1 — див. §9.)
5. Іконки **Lucide, stroke 1.5, outline, currentColor**. Без емодзі, без unicode-стрілок.
6. Багато білого простору. Тіні майже не вживаємо — тонка рамка `1px #D4D4D8`.
7. Мова **українська**, на «Ви», тепло-професійно, короткі речення, без канцеляризмів.
8. Мапа — **Leaflet + OpenStreetMap**, жорстко обмежена Україною, старт Київ-центр; кадастр — toggle-шар поверх.

---

## 1. Продукт

**Mayno** (робоча назва, від «майно») — сайт перевірки нерухомості. Користувач за ~60 секунд бачить ділянку/об'єкт на кадастровій мапі, замовляє офіційні витяги з ДЗК/ДРРП, отримує PDF. Альтернатива нестабільним держканалам (Дія, Мінюст).

**Замовник:** ТОВ «ФАВОР АРХІТЕКТ», ЄДРПОУ 42341537, Запоріжжя. Контакт: favorarch@gmail.com, +38 (050) 027-07-29.

**Стилістична позиція:** інспіровано diia.gov.ua (мінімалізм, велика чорна типографіка, pill-кнопки, світло-блакитні фіч-блоки), **але не Дія** — наш акцент Bank ID green, радіус 8px, шрифт Inter, лого `mayno` lowercase. Без тризуба/синьо-жовтого/помаранчевого.

### Основний флоу
1. Головна → велике поле пошуку (адреса / кадастровий №, автокомпліт).
2. Перехід на мапу → кадастрові межі поверх карти → клік на ділянку.
3. Бокова панель (desktop) / bottom-sheet (mobile) з даними + каталогом послуг.
4. «Замовити витяг» → ЕЦП-логін (якщо не залогінений).
5. Авторизація: **Bank ID НБУ** (основний) / Дія.Підпис / Файловий ключ / Апаратний ключ.
6. Оплата (LiqPay/Fondy) → PDF на email + у кабінет.

### Каталог послуг (8)
| Послуга | Ціна | Час |
|---|---|---|
| Витяг з ДЗК | 100 ₴ | 60 сек |
| Витяг з ДРРП | 300 ₴ | 60 сек |
| Повний звіт (ДЗК+ДРРП+AI-аналіз) | 400 ₴ | 90 сек |
| НГО | 100 ₴ | 60 сек |
| Кадастровий план | 100 ₴ | 60 сек |
| Пошук власника | 250 ₴ | до 24 год |
| Експертна оцінка | від 2 000 ₴ | 24–72 год |
| Геодезія | за договором | 1–2 тижні |

**У боковій панелі мапи показуємо ТІЛЬКИ 3 головні** (ДЗК, ДРРП, Повний звіт) + лінк «Ще 5 послуг → /pricing». Решта — у каталозі на /pricing.

### Тарифи-підписки (4)
Free (0 ₴, 3 пошуки/міс, PDF з вотермаркою) · Personal (299 ₴/міс) · **Realtor (999 ₴/міс — рекомендований)** · Agency (4 999 ₴/міс, команда, API).

### Sitemap
```
/                 Головна             /pricing          Тарифи + каталог
/map              Мапа (ключовий)     /how-it-works     Як працює
/parcel/[№]       Сторінка ділянки    /blog             Блог (+ стаття)
/object/[id]      Сторінка об'єкта    /contacts         Контакти
/login            ЕЦП-вхід            /about            Про нас
/app/*            Кабінет             /legal/*          5 документів
```

---

## 2. Технічний стек (UI kit)

- **React 18.3.1** + **Babel standalone 7.29.0** (pinned, з integrity-хешами — див. будь-який `*.html`).
- **Inline-styles** (не CSS-класи в компонентах) + один спільний `styles.css` з утилітами (`.btn`, `.input`, `.card`, `.badge`, `.container`).
- **Leaflet 1.9.4** (CDN, integrity) для мапи.
- Компоненти експортуються на `window` (`window.Home = Home` тощо), бо кожен `<script type="text/babel">` має власний scope.
- Роутинг — state-based у `app.jsx` (`screen` + `window.__startScreen` для прямих посилань). У проді — заміни на файловий роутинг Next.js.

**Production-нотатка:** UI kit навмисно «зрізає кути» по функціоналу (фейкова оплата/авторизація, demo-дані). Бери з нього **візуал і структуру**, не реалізацію.

---

## 3. Дизайн-токени

Канон — `colors_and_type.css` (root-рівень). Усі змінні нижче вже там.

### Колір
```css
/* Core */
--black:   #0A0A0A;   /* текст, primary CTA, чорний pill, іконки */
--white:   #FFFFFF;
--green:   #22C55E;   /* ЄДИНИЙ акцент (Bank ID green) — лише головні позитивні дії */

/* Surfaces */
--surface-soft:  #F8F9FB;   /* секції, sidebar кабінету, hover secondary */
--surface-blue:  #E8F0F5;   /* фіч-картки, Bank ID картка на /login */
--surface-green: #E8F8EE;   /* success-блоки, моніторинг-promo */

/* Status (тільки системні повідомлення; success ≠ accent green) */
--success: #16A34A;  --warning: #EAB308;  --danger: #DC2626;  --info: #0284C7;

/* Neutrals */
--gray-800: #27272A;  --gray-500: #71717A;  --gray-300: #D4D4D8;  --gray-100: #F4F4F5;
```
**Заборонено:** помаранчевий, navy, фіолетово-сині градієнти, будь-які градієнти на UI, тризуб, синьо-жовте, кольорові тіні.

**Коли який pill:**
- **Чорний** — звичайні CTA: «Знайти», «Увійти», «Дізнатись більше».
- **Зелений** — ТІЛЬКИ головні позитивні дії: «Замовити витяг», «Підтвердити оплату», «Підписатись». **Максимум одна зелена кнопка в полі зору.**
- **Secondary** — прозора + рамка `1.5px solid #0A0A0A`.
- **Ghost** — без рамки, hover-фон `#F4F4F5`.

### Типографіка
- **Inter** (Google Fonts, кирилиця), weights 400/500/600/700.
- **JetBrains Mono** (500) — кадастрові номери, координати, ID, дати в технічних контекстах. **Ніколи Inter для кадастрового номера.**

| Стиль | Розмір/LH | Weight | Tracking | Де |
|---|---|---|---|---|
| Hero | 64/72 | 700 | -0.02em | H1 головної |
| H1 | 40/48 | 700 | -0.02em | заголовки сторінок |
| H2 | 28/36 | 700 | -0.01em | секції |
| H3 | 20/28 | 600 | -0.005em | картки, форми |
| Body L | 18/28 | 400 | — | lead, hero-sub |
| Body | 16/24 | 400 | — | звичайний текст |
| Small | 14/20 | 400 | — | captions |
| Tiny | 12/16 | 500 | 0.02em | labels UPPERCASE |
| Mono | 18/24 | 500 | — | кадастровий № у header панелі |

На mobile: Hero→40, H1→28–32, H2→28.

### Spacing (база 4px)
`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128` → `--space-1…--space-10`.
Ритм: **24px між блоками, 48–96px між секціями.** Контейнер `max-width:1280px`, padding `32px` desktop / `16px` mobile.

### Радіуси
`--radius-sm:4` (теги, чекбокси) · `--radius:8` (**default** — картки, інпути) · `--radius-lg:12` (модалки, великі картки, Bank ID картка) · `--radius-full:999` (**тільки кнопки**).

### Тіні
```css
--shadow-sm: 0 1px 2px rgba(10,10,10,.04);
--shadow:    0 4px 12px rgba(10,10,10,.06);
--shadow-lg: 0 12px 24px rgba(10,10,10,.10);
```
Більшість поверхонь — **без тіні**, лише рамка `1px #D4D4D8`. Тіні тільки на dropdown / модалці / правій панелі мапи / sticky-CTA. Без кольорових тіней.

### Бордери
Default `1px solid #D4D4D8`. Secondary-кнопка й outline-tile `1.5px solid #0A0A0A`. Focus інпута `2px #0A0A0A` + ring `4px rgba(212,212,216,.4)`.

### Motion
150ms hover · 200ms press · 300ms entrance панелей. Easing `cubic-bezier(0.2,0,0,1)`. Без баунсу, parallax, scroll-driven. Loading — skeleton, не spinner.

### Hover / Press
| Елемент | Hover | Press |
|---|---|---|
| Чорний pill | `#1F1F1F` | `#000000` + scale(.98) |
| Зелений pill | `#16A34A` | `#15803D` + scale(.98) |
| Secondary | фон `#F8F9FB` | фон `#E8F0F5` |
| Ghost | фон `#F4F4F5` | фон `#D4D4D8` |
| Клікабельна картка | рамка→`#0A0A0A` + shadow-sm | scale(.99) |

---

## 4. Іконки

**Lucide** (lucide.dev). `stroke-width: 1.5`, `currentColor`, **outline only** (filled — лише активний пункт навігації). Розміри: 16 (inline), 20 (default — кнопки/інпути), 24 (картки/нав), 32 (outline-tile ЕЦП).

У UI kit іконки — inline-SVG в `Icons.jsx` (`<Icon name="search" size={20}/>`), бо не залежать від CDN. У проді можна `lucide-react`. Канонічний набір імен — у `Icons.jsx` + README §ICONOGRAPHY.

**Без емодзі. Без unicode «→» як іконок** (бери Lucide `arrow-right`). Без кастомних SVG-ілюстрацій у стилі Дії.

**Логотипи ЕЦП** (Bank ID, Дія.Підпис) — текстові лейбли (бренди не вільні): Bank ID = зелена плашка `BANK ID`, Дія.Підпис = слово в outline-tile. Замінити на офіційні SVG лише за наявності дозволу.

**Лого Mayno** — ворд-марк `mayno` (Inter 700, lowercase, `-0.03em`). Compact — `m` у чорному квадраті radius 8. Файли: `assets/logo-mayno.svg`, `assets/logo-mayno-mark.svg`.

---

## 5. Компоненти (еталон — `ui_kits/web/`)

| Файл | Експортує | Призначення |
|---|---|---|
| `Icons.jsx` | `Icon` | inline Lucide SVG |
| `Buttons.jsx` | `Button, IconButton, Tile, TopBar, Footer, CookieBanner` | базові + хром |
| `hooks.jsx` | `useIsMobile` | breakpoint 768 (+ `window.__forceMobile`) |
| `Home.jsx` | `Home` | головна (hero, how, what-you-get, pricing-teaser, dark-CTA) |
| `MapView.jsx` | `MapView, CadastralMap` | мапа + ліва панель/drawer + bottom-sheet |
| `ParcelPanel.jsx` | `ParcelPanel` | бокова панель ділянки (3 послуги) |
| `Parcel.jsx` | `Parcel` | сторінка ділянки (SEO + paywall) |
| `ObjectPage.jsx` | `ObjectPage` | сторінка об'єкта (квартира/будинок) |
| `Login.jsx` | `Login` | ЕЦП-вхід |
| `Pricing.jsx` | `Pricing` | каталог 8 послуг + 4 тарифи |
| `Dashboard.jsx` | `Dashboard` | кабінет (sidebar + замовлення/моніторинг/профіль) |
| `Legal.jsx` | `LegalPage` | 5 юр-документів |
| `HowItWorks.jsx` | `HowItWorks` | кроки + реєстри + безпека |
| `Blog.jsx` | `Blog` | список + режим читання статті |
| `Contacts.jsx` | `Contacts` | канали + реквізити + форма |
| `About.jsx` | `About` | про компанію |
| `app.jsx` | — | роутинг + demo-дані |

### Кнопка (канон)
```css
.btn { display:inline-flex; align-items:center; justify-content:center; gap:8px;
  height:48px; flex:none; padding:0 24px; border:0; border-radius:999px;
  font:500 16px/1 'Inter',sans-serif; white-space:nowrap; cursor:pointer;
  transition:background 150ms cubic-bezier(.2,0,0,1), transform 200ms; }
.btn-sm{height:40px;padding:0 16px;font-size:14px} .btn-xs{height:32px;padding:0 12px;font-size:14px}
.btn-lg{height:56px;padding:0 32px;font-size:18px}
.btn-black{background:#0A0A0A;color:#fff} .btn-green{background:#22C55E;color:#fff}
.btn-secondary{background:transparent;color:#0A0A0A;border:1.5px solid #0A0A0A}
.btn-ghost{background:transparent;color:#0A0A0A}
```

### Інпут / Картка / Бейдж
```css
.input{height:48px;padding:0 16px;border:1px solid #D4D4D8;border-radius:8px;font:16px 'Inter'}
.input:focus{border-width:1.5px;border-color:#0A0A0A;box-shadow:0 0 0 4px rgba(212,212,216,.4)}
.card{background:#fff;border:1px solid #D4D4D8;border-radius:8px;padding:24px}
.badge{height:28px;padding:0 12px;border-radius:999px;font:500 14px 'Inter';background:#F4F4F5}
.badge-green{background:#22C55E;color:#fff}   /* ціни */
```

### Outline-tile (ЕЦП-альтернативи, як «Файловий ключ →» у Дії)
`height:80; border:1.5px solid #0A0A0A; border-radius:8;` лейбл + Lucide `arrow-right`. На mobile у /login — стек вертикально.

### Картка послуги (бокова панель)
grid `24px 1fr auto`: Lucide-іконка + (назва + опис·час mono) + green-badge ціни. Hover: рамка→чорна, фон→soft.

---

## 6. Специфікація екранів

**TopBar (усі сторінки):** sticky, `height:64`, фон білий, `border-bottom:1px #F4F4F5`. Зліва лого `mayno` + nav (Мапа/Тарифи/Як працює/Блог). Справа: «Увійти» (чорний btn-sm) або «Кабінет» (ghost + user-icon). Mobile: бургер зліва, лого по центру, drawer.

**Footer:** 5 колонок (Продукт/Тарифи/Компанія/Юридичне + бренд-блок). Знизу — © ТОВ ФАВОР АРХІТЕКТ + ЄДРПОУ. Mobile: 2 колонки.

**01 Home** — hero (H1 64 центр + sub + search-bar 64px з автокомплітом + chips) → trust-strip → «Як це працює» (3 картки на surface-soft) → «Що ви отримаєте» (2 колонки + PDF-mockup) → pricing-teaser (3 тарифи, Personal чорна) → dark-CTA.

**02 Map** — TopBar + ліва панель `320px` (пошук, шари-toggle, фільтри, інструменти) + мапа (fluid) + права панель `420px` (ParcelPanel). Контролі зуму праворуч знизу — **квадратні білі 40px radius 8 з тінню**. Mobile: search-bar + filter-btn → drawer; панель ділянки → bottom-sheet 70% з drag-handle + sticky green-CTA.

**ParcelPanel** — header (кадастр№ mono 18 + bookmark + close) → інфо (адреса, площа mono, цільове, власність, координати mono) на surface-soft → «Замовити документи» (3 картки) + лінк «Ще 5 послуг» → дії (копіювати/закласти/маршрут/поділитись) → моніторинг-promo (surface-green).

**03 Login** — міні-хедер (лого + Назад). H1 «Оберіть спосіб входу» центр. Bank ID — велика картка на surface-blue (badge «Рекомендований», опис, зелена плашка BANK ID, чорна btn-lg). Нижче — 3 outline-tiles (Дія.Підпис/Файловий/Апаратний). Внизу — security-note (lock + текст про те, що ключі не зберігаємо). Mobile: tiles стеком.

**04 Parcel** (`/parcel/[№]`) — SEO-сторінка ділянки з paywall: hero з кадастр№, безкоштовні базові дані, заблюрені платні (ДРРП), CTA замовлення, схожі ділянки.

**05 Object** (`/object/[id]`) — квартира/будинок: gallery (фото-плейсхолдери), spec-картки (площа/кімнат/поверх/рік), «Дані з реєстрів» (таблиця, номери mono), таймлайн власників з blur-paywall, обтяження (surface-green), sticky order-rail (ринкова оцінка чорна картка + повний звіт 400₴ + ДРРП/ДЗК + моніторинг). Mobile sticky-CTA.

**06 Pricing** — каталог усіх 8 послуг (картки з іконкою/описом/ціною/часом) + 4 тарифи (Realtor виділений) + FAQ-тизер.

**07 Dashboard** (`/app/*`) — sidebar `240px` (surface-soft) + контент max 1080. Розділи: огляд, замовлення (таблиця/картки зі статусами), моніторинг, профіль (дані з ЕЦП), білінг. Empty-state: «Ваші звіти будуть тут».

**08 Legal** (`/legal/*`) — 5 документів (privacy, terms, offer, cookies, refund) з лівим змістом + типографічний контент.

**09 How it works** — 4 кроки (badge-номери) + блок «Що таке ДЗК і ДРРП» + 3-колонкова безпека + FAQ-лінк.

**10 Blog** — featured-картка + grid статей + **режим читання** (клік → стаття з callout-порадою + CTA).

**11 Contacts** — канали (email/телефон/час) + реквізити компанії + форма зі success-станом.

**12 About** — hero-місія + 4 цифри + історія («Чому ми це створили») + 4 принципи + картка компанії (реквізити) + dark-CTA.

---

## 7. Копірайт

- **Українська, на «Ви»**, тепло-професійно. Короткі речення (5–12 слів), активні дієслова, конкретні цифри. Без канцеляризмів. **Без емодзі** в інтерфейсі.

| ❌ | ✅ |
|---|---|
| Записи відсутні | Ваші звіти будуть тут |
| Здійснити перевірку | Перевірте |
| Розпочати роботу з сервісом | Знайти ділянку |
| Здійснити оплату | Перейти до оплати |

**Канонічні рядки:** Hero «Перевірте нерухомість в Україні» · sub «За 60 секунд: ДЗК, ДРРП, аналіз ризиків. Через ЕЦП.» · search «Введіть адресу або кадастровий номер» · CTA «Замовити витяг» / «Замовити за 100 грн» · login «Оберіть спосіб входу» · empty «Ваші звіти будуть тут» · success «Готово. Витяг чекає у вашому кабінеті.»

---

## 8. Мапа

- **Leaflet + OpenStreetMap** tiles (без ключа); супутник — Esri World Imagery toggle. Прод — можна MapTiler Streets.
- Жорсткі межі України: `maxBounds=[[44.3,22.1],[52.4,40.2]]`, `maxBoundsViscosity:1`. Старт Київ-центр `[50.4498,30.5235]` zoom 18. `minZoom 6 / maxZoom 19`. `zoomControl:false` (свої контролі).
- Кадастр — **окремий toggle-шар** поверх базового. Виділена ділянка: `fill #22C55E @40% + border #22C55E 2px`. Hover: `fill #0A0A0A @15%`. Tooltip — кадастр№ (JetBrains Mono 12) у `.mayno-tooltip` (біла плашка, рамка, тінь).
- Контролі (zoom +/−, моя локація=Київ, глобус=вся Україна) — праворуч знизу, **білі квадрати 40px radius 8 з тінню**. При відкритій правій панелі — підсунуті ліворуч (`right:444`).
- Імперативний доступ: `window.__maynoMap` (екземпляр Leaflet) → `.zoomIn()`, `.flyTo()`, `.flyToBounds(UA_BOUNDS)`.

---

## 9. 🔴 Чек-лист «зробити як еталон» (типові баги)

- [ ] **Кнопки не «гумові»**: усі мають `height` (48/40/32/56) + `flex:none`; flex-батько `align-items:center` (НЕ `stretch`). Інакше pill-радіус робить з кнопки вертикальний овал.
- [ ] Шапка `height:64`, «Увійти» = btn-sm по центру, не вилазить за край.
- [ ] Hero-search — контейнер 64px, кнопка «Знайти» по центру, не розтягнута.
- [ ] Кадастрові номери/координати — **JetBrains Mono**, не Inter.
- [ ] Зелений pill — максимум на одній головній дії на екран.
- [ ] Жодних градієнтів / емодзі / кольорових тіней / помаранчевого / navy.
- [ ] Радіус 8px скрізь, pill (999) тільки кнопки.
- [ ] Іконки Lucide stroke 1.5 outline; без unicode-стрілок.
- [ ] Мапа обмежена Україною; кадастр — toggle-шар.
- [ ] Тіні майже не вживати — тонка рамка `1px #D4D4D8`.

---

## 10. Файли репозиторію

```
README.md             повний бренд-довідник (content/visual/iconography foundations)
DESIGN.md             ← цей файл (для агентів)
SKILL.md              Agent-Skill маніфест
CLAUDE_CODE_FIX.md    точкова інструкція з фіксу кнопок (підмножина §9)
brief_extracted.txt   текст v2-брифу
colors_and_type.css   ВСІ токени + утиліти (.btn/.input/.card/.badge) — підключай це
fonts/                Inter + JetBrains Mono (інструкція self-host)
assets/               логотипи (svg)
preview/              27 карток дизайн-системи (Design System tab)
ui_kits/web/          ЕТАЛОН: 16 компонентів + 11 html-точок входу + mobile.html
```

**Старти для перегляду:** `ui_kits/web/index.html` (повний клік-через), `mobile.html` (3 iPhone-фрейми), або `<name>.html` для конкретного екрана (`pricing.html`, `dashboard.html`, `object.html`, `about.html`, …).

> Будь-яка зміна стилю → спершу звірити з відповідним компонентом у `ui_kits/web/` і токенами в `colors_and_type.css`. Не вигадувати нові кольори/радіуси/тіні.
