#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────────────────
# Mayno — автоматичний деплой на Vercel
# Запуск: bash scripts/deploy.sh
# ────────────────────────────────────────────────────────────────────────────
set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✓${NC} $1"; }
info() { echo -e "${YELLOW}→${NC} $1"; }
err()  { echo -e "${RED}✗${NC} $1"; exit 1; }
ask()  { echo -e "${BOLD}$1${NC}"; }

echo ""
echo -e "${BOLD}━━━ Mayno Deploy ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── 1. Vercel CLI ─────────────────────────────────────────────────────
if ! command -v vercel &>/dev/null; then
  info "Встановлюю Vercel CLI..."
  npm install -g vercel
fi
ok "Vercel CLI $(vercel --version)"

# ── 2. GitHub CLI ─────────────────────────────────────────────────────
if ! command -v gh &>/dev/null; then
  info "Встановлюю GitHub CLI..."
  if command -v brew &>/dev/null; then
    brew install gh
  else
    err "Встанови GitHub CLI вручну: https://cli.github.com"
  fi
fi
ok "GitHub CLI $(gh --version | head -1)"

# ── 3. GitHub авторизація ─────────────────────────────────────────────
if ! gh auth status &>/dev/null; then
  info "Авторизуйся в GitHub (відкриється браузер)..."
  gh auth login --web
fi
ok "GitHub авторизовано ($(gh api user -q .login))"

# ── 4. GitHub репозиторій ─────────────────────────────────────────────
if ! git remote get-url origin &>/dev/null; then
  info "Створюю GitHub репозиторій mayno-app..."
  gh repo create mayno-app --private --source=. --remote=origin --push
  ok "Репо створено і код запушено"
else
  REMOTE=$(git remote get-url origin)
  ok "Репо вже підключено: $REMOTE"
  info "Пушу актуальний код..."
  git push origin main
fi

# ── 5. DATABASE_URL ───────────────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━ База даних ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if grep -q "^DATABASE_URL=" .env.local 2>/dev/null; then
  ok "DATABASE_URL вже є в .env.local"
else
  echo ""
  ask "DATABASE_URL не знайдено."
  echo "1. Відкрий https://neon.tech → Sign Up → New Project (назви 'mayno')"
  echo "2. Скопіюй Connection string (вигляд: postgresql://...@ep-....neon.tech/neondb?sslmode=require)"
  echo ""
  read -rp "Встав DATABASE_URL сюди: " DB_URL
  if [[ -z "$DB_URL" ]]; then
    err "DATABASE_URL не введено"
  fi
  echo "DATABASE_URL=$DB_URL" >> .env.local
  ok "DATABASE_URL збережено"
fi

# ── 6. Prisma migrate ─────────────────────────────────────────────────
echo ""
info "Запускаю міграції БД..."
npx prisma migrate deploy 2>&1 | tail -5
ok "Міграції виконано"

# ── 7. Vercel deploy ──────────────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━ Vercel ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

info "Авторизуюсь у Vercel..."
vercel whoami || vercel login

info "Деплою проєкт..."
VERCEL_URL=$(vercel --prod --yes 2>&1 | grep "https://" | tail -1)

if [[ -z "$VERCEL_URL" ]]; then
  # Якщо URL не зловили — отримуємо через vercel ls
  VERCEL_URL=$(vercel ls --prod 2>/dev/null | grep "mayno" | awk '{print $2}' | head -1)
fi

# ── 8. Додаємо env vars у Vercel ─────────────────────────────────────
echo ""
info "Додаю environment variables у Vercel..."

add_env() {
  local key="$1"
  local val
  val=$(grep "^${key}=" .env.local | cut -d= -f2-)
  if [[ -n "$val" ]]; then
    echo "$val" | vercel env add "$key" production --force 2>/dev/null && ok "  $key" || true
  fi
}

add_env "DATABASE_URL"
add_env "NEXT_PUBLIC_MAPBOX_TOKEN"
add_env "VAPID_PUBLIC_KEY"
add_env "VAPID_PRIVATE_KEY"
add_env "VAPID_SUBJECT"

# NEXT_PUBLIC_APP_URL — встановлюємо через Vercel URL
if [[ -n "$VERCEL_URL" ]]; then
  echo "https://$VERCEL_URL" | vercel env add NEXT_PUBLIC_APP_URL production --force 2>/dev/null
  ok "  NEXT_PUBLIC_APP_URL=https://$VERCEL_URL"
fi

# ── 9. Фінальний redeploy з env vars ─────────────────────────────────
echo ""
info "Фінальний деплой з усіма змінними..."
vercel --prod --yes

echo ""
echo -e "${GREEN}${BOLD}━━━ Готово! ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
if [[ -n "$VERCEL_URL" ]]; then
  echo -e "  🌐 ${BOLD}https://$VERCEL_URL${NC}"
else
  echo -e "  Відкрий ${BOLD}https://vercel.com/dashboard${NC} щоб побачити URL"
fi
echo ""
