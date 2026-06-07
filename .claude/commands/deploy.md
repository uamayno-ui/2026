# Deploy Mayno to Vercel

Автоматичний деплой проєкту Mayno. Виконай ці кроки по порядку:

## Крок 1 — Встанови інструменти

```bash
npm install -g vercel
brew install gh
```

## Крок 2 — Авторизація GitHub

```bash
gh auth login
```
Вибери: GitHub.com → HTTPS → Login with a web browser

## Крок 3 — Створи GitHub репозиторій і запушти код

```bash
cd /Users/alex/Documents/Claude/Projects/ДЗК/mayno-app
gh repo create mayno-app --private --source=. --remote=origin --push
```

## Крок 4 — Перевір DATABASE_URL

Перевір чи є DATABASE_URL в .env.local:
```bash
grep DATABASE_URL /Users/alex/Documents/Claude/Projects/ДЗК/mayno-app/.env.local
```

Якщо немає — відкрий https://neon.tech, створи безкоштовний проєкт, скопіюй connection string, і додай:
```bash
echo 'DATABASE_URL=postgresql://ВСТАВИТИ_СЮДИ' >> /Users/alex/Documents/Claude/Projects/ДЗК/mayno-app/.env.local
```

## Крок 5 — Запусти міграції БД

```bash
cd /Users/alex/Documents/Claude/Projects/ДЗК/mayno-app
npx prisma migrate deploy
```

## Крок 6 — Деплой на Vercel

```bash
cd /Users/alex/Documents/Claude/Projects/ДЗК/mayno-app
vercel --prod
```

Vercel запитає:
- Set up and deploy? → **Y**
- Which scope? → вибери свій акаунт
- Link to existing project? → **N**
- Project name? → **mayno-app**
- Directory? → **./** (Enter)

## Крок 7 — Додай env variables у Vercel

```bash
# Додає всі змінні з .env.local автоматично
vercel env pull
grep -v '^#' /Users/alex/Documents/Claude/Projects/ДЗК/mayno-app/.env.local | grep '=' | while IFS='=' read -r key value; do
  [ -n "$key" ] && vercel env add "$key" production <<< "$value"
done
```

Або вручну через dashboard: https://vercel.com/dashboard → Settings → Environment Variables

Мінімально необхідні:
- `DATABASE_URL`
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `NEXT_PUBLIC_APP_URL` = `https://mayno-app.vercel.app`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

## Крок 8 — Фінальний деплой з env vars

```bash
vercel --prod
```

## Перевірка

```bash
vercel logs --prod | tail -20
```
