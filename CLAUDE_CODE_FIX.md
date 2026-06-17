# Інструкція для Claude Code — привести дизайн Mayno до еталону

> Передай цей файл Claude Code разом із доступом до дизайн-системи (`colors_and_type.css`, `ui_kits/web/`). Він описує конкретні баги на поточному білді й точні правила, як їх виправити.

---

## 🔴 ГОЛОВНИЙ БАГ: кнопки розтягнуті у вертикальні овали

На головній і на мапі кнопки **«Увійти»** та **«Знайти»** рендеряться як високі чорні «капсули» (одна вилазить за верхній край екрана). Це найпомітніша відмінність від еталону.

### Причина
Кнопка має `border-radius: 999px` (pill), але лежить у flex-контейнері **без фіксованої висоти**. За замовчуванням `align-items: stretch` розтягує кнопку на всю висоту контейнера (шапки 64px → 80px, або hero-search 64px), а pill-радіус перетворює прямокутник на овал.

### Як правильно (еталон)
Кнопка ЗАВЖДИ має:
1. **Фіксовану висоту** (`height: 48px` — основна, `40px` — sm, `32px` — xs). Ніколи не «гумова» висота.
2. **`flex: none` / `flex-shrink: 0`** — щоб flex-батько її не стискав і не розтягував.
3. Батьківський flex-контейнер — **`align-items: center`**, а не `stretch`.
4. `display: inline-flex; align-items: center; justify-content: center;` всередині самої кнопки.

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;            /* ← КРИТИЧНО: фіксована висота */
  flex: none;             /* ← не розтягуватись/стискатись у flex-батьку */
  padding: 0 24px;
  border: 0;
  border-radius: 999px;   /* pill — працює тільки з фіксованою висотою */
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
}
.btn-sm { height: 40px; padding: 0 16px; font-size: 14px; }
.btn-xs { height: 32px; padding: 0 12px; font-size: 14px; }
.btn-lg { height: 56px; padding: 0 32px; font-size: 18px; }
```

### Шапка (header) — окремо
Шапка має **фіксовану висоту `64px`** і `align-items: center`. Кнопка «Увійти» — `btn-sm` (40px), вертикально по центру. Якщо кнопка вилазить за верх — значить десь `align-items: stretch` або немає `height` у шапки.

```css
header {
  height: 64px;
  display: flex;
  align-items: center;        /* ← не stretch */
  border-bottom: 1px solid #F4F4F5;
  background: #fff;
}
```

### Hero-search — окремо
Рядок пошуку = контейнер висотою **64px** з `align-items: center`. Усередині: іконка пошуку (20px) + `<input>` (прозорий, без рамки, flex: 1) + кнопка «Знайти» (`btn`, 48px). Кнопка НЕ розтягується бо має `flex: none` + `height: 48px`.

```html
<div style="display:flex; align-items:center; gap:8px; height:64px;
            padding:0 8px 0 20px; border:1px solid #D4D4D8; border-radius:8px;">
  <svg><!-- lucide search 20px --></svg>
  <input style="flex:1; height:100%; border:0; outline:0; background:transparent; font-size:18px;"
         placeholder="Введіть адресу або кадастровий номер">
  <button class="btn btn-black"><!-- height:48px, flex:none -->Знайти</button>
</div>
```

---

## Палітра — тільки ці кольори (інших не вигадувати)

```css
--black:        #0A0A0A;  /* текст, primary CTA, чорний pill */
--white:        #FFFFFF;
--green:        #22C55E;  /* ЄДИНИЙ акцент — Bank ID green. Тільки головні позитивні дії */
--surface-soft: #F8F9FB;  /* секції, sidebar */
--surface-blue: #E8F0F5;  /* фіч-картки, Bank ID картка */
--surface-green:#E8F8EE;  /* success / моніторинг promo */
--gray-500:     #71717A;  /* вторинний текст, плейсхолдери */
--gray-300:     #D4D4D8;  /* бордери, дільники */
--gray-100:     #F4F4F5;  /* hover-фони, тонкі дільники */
```

**Заборонено:** помаранчевий, navy, фіолетово-сині градієнти, тризуб, синьо-жовте. Жодних градієнтів на UI взагалі.

### Коли який pill
- **Чорний pill** (`--black`) — звичайні CTA: «Знайти», «Увійти», «Замовити».
- **Зелений pill** (`--green`) — ТІЛЬКИ головні позитивні дії: «Замовити витяг», «Підтвердити оплату», «Підписатись». Не більше однієї зеленої кнопки в полі зору.
- **Secondary** — прозора, рамка `1.5px solid #0A0A0A`.
- **Ghost** — без рамки, hover = фон `#F4F4F5`.

---

## Типографіка

- Шрифт **Inter** (Google Fonts), кирилиця. Mono — **JetBrains Mono** тільки для кадастрових номерів/координат.
- Масштаб: Hero `64px/72 700`, H1 `40/48 700`, H2 `28/36 700`, H3 `20/28 600`, Body `16/24 400`, Small `14/20`, Tiny `12 500 uppercase`.
- Заголовки — `letter-spacing: -0.02em` (Hero/H1), велика і впевнена чорна типографіка.
- Кадастровий номер — `font-family: 'JetBrains Mono'; font-weight: 500;` ЗАВЖДИ. Не Inter.

---

## Радіуси, бордери, тіні

- Радіус **8px** — за замовчуванням (картки, інпути, модалки). Pill (`999px`) — тільки кнопки. 12px — великі картки/модалки.
- Бордер — `1px solid #D4D4D8`. Secondary-кнопка й outline-tile — `1.5px solid #0A0A0A`.
- **Більшість поверхонь — БЕЗ тіні**, лише тонка рамка. Тіні тільки на dropdown / модалці / правій панелі мапи: `0 4px 12px rgba(10,10,10,0.06)`.
- Жодних кольорових тіней.

---

## Іконки

- **Lucide**, `stroke-width: 1.5`, `currentColor`, outline (не filled). Розміри 16/20/24/32.
- **Жодних емодзі** в інтерфейсі. Жодних unicode-стрілок «→» як іконок — теж Lucide (`arrow-right`).

---

## Spacing / Layout

- Контейнер `max-width: 1280px`, відступи по боках `32px` (desktop) / `16px` (mobile).
- Вертикальний ритм: `24px` між блоками, `48–96px` між секціями.
- Шкала 4px: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96`.
- Багато білого простору. Hero — `padding-top: 120px`.

---

## Hover / Press (тонко!)

| Елемент | Hover | Press |
|---|---|---|
| Чорний pill | `#1F1F1F` | `#000000` + `scale(0.98)` |
| Зелений pill | `#16A34A` | `#15803D` + `scale(0.98)` |
| Secondary | фон `#F8F9FB` | фон `#E8F0F5` |
| Ghost | фон `#F4F4F5` | фон `#D4D4D8` |
| Картка (клікабельна) | рамка → `#0A0A0A` + тонка тінь | `scale(0.99)` |

Анімації: `150ms` hover, `200ms` press, `easing: cubic-bezier(0.2, 0, 0, 1)`. Без баунсу, без parallax.

---

## Мапа

- **Leaflet + OpenStreetMap** tiles (без API-ключа), або MapTiler Streets у проді.
- Жорсткі межі України: `maxBounds = [[44.3, 22.1], [52.4, 40.2]]`, `maxBoundsViscosity: 1`. Старт — Київ-центр, zoom 18.
- Кадастр — окремий toggle-шар поверх. Виділена ділянка: `fill #22C55E @40%` + рамка `#22C55E 2px`. Hover: `fill #0A0A0A @15%`.
- Контролі (zoom +/−, моя локація, вся Україна) — праворуч знизу, **квадратні білі кнопки 40px з радіусом 8px і тінню**. На скріні вони зараз нормальні — добре. Toggle-перемикачі шарів — теж ок.

---

## Чек-лист «зробити як еталон»

- [ ] Усі кнопки мають `height` (48/40/32/56) + `flex: none`. Жодна не «гумова».
- [ ] Усі flex-контейнери з кнопками — `align-items: center`, не `stretch`.
- [ ] Шапка `height: 64px`, кнопка «Увійти» = `btn-sm` по центру, не вилазить за край.
- [ ] Hero-search — контейнер 64px, кнопка «Знайти» по центру всередині, не розтягнута.
- [ ] Кадастрові номери — JetBrains Mono.
- [ ] Зелений — тільки на одній головній позитивній дії на екран.
- [ ] Жодних градієнтів / емодзі / кольорових тіней.
- [ ] Радіус 8px скрізь, pill тільки на кнопках.

> Еталонна реалізація всіх компонентів — у `ui_kits/web/` (Buttons.jsx, Home.jsx, MapView.jsx). Звіряйся з нею покомпонентно.
