#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────────────────
# Mayno — автоматичний деплой на Vercel (без GitHub CLI)
# Запуск: bash scripts/deploy.sh
# ────────────────────────────────────────────────────────────────────────────
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✓${NC} $1"; }
info() { echo -e "${YELLOW}→${NC} $1"; }
err()  { echo -e "${RED}✗ $1${NC}"; exit 1; }

echo ""
echo -e "${BOLD}━━━ Mayno Deploy ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── 1. Vercel CLI ─────────────────────────────────────────────────────
if ! command -v vercel &>/dev/null; then
  info "Встановлюю Vercel CLI..."
  npm install -g vercel
fi
ok "Vercel CLI $(vercel --version)"

# ── 2. DATABASE_URL ───────────────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━ База даних (Neon) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if grep -q "^DATABASE_URL=postgres" .env.local 2>/dev/null; then
  ok "DATABASE_URL вже є в .env.local"
else
  echo "  Потрібна безкоштовна PostgreSQL БД від Neon."
  echo ""
  echo -e "  ${BOLD}1.${NC} Відкрий у браузері: ${BOLD}https://neon.tech${NC}"
  echo -e "  ${BOLD}2.${NC} Sign Up (GitHub або email)"
  echo -e "  ${BOLD}3.${NC} New Project → назви 'mayno' → Create"
  echo -e "  ${BOLD}4.${NC} Connection string → скопіюй рядок що починається з postgresql://"
  echo ""
  read -rp "  Встав DATABASE_URL: " DB_URL
  [[ -z "$DB_URL" ]] && err "DATABASE_URL не введено. Спробуй ще раз."
  # Видаляємо старий рядок якщо є і додаємо новий
  grep -v "^DATABASE_URL=" .env.local > .env.local.tmp && mv .env.local.tmp .env.local || true
  echo "DATABASE_URL=$DB_URL" >> .env.local
  ok "DATABASE_URL збережено"
fi

# ── 3. Prisma migrate ─────────────────────────────────────────────────
echo ""
info "Запускаю міграції БД..."
if npx prisma migrate deploy 2>&1 | tail -5; then
  ok "Міграції виконано"
else
  err "migrate deploy не вдався. Production deploy зупинено; destructive db push заборонено."
fi

# ── 4. Vercel авторизація ─────────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━ Vercel ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if ! vercel whoami &>/dev/null; then
  info "Авторизуйся у Vercel (відкриється браузер)..."
  vercel login
fi
ok "Vercel: $(vercel whoami)"

# ── 5. Перший деплой ──────────────────────────────────────────────────
info "Деплою проєкт на Vercel..."
echo ""

# --yes пропускає інтерактивні питання, використовує дефолтні відповіді
DEPLOY_OUTPUT=$(vercel --prod --yes 2>&1)
echo "$DEPLOY_OUTPUT" | tail -10

VERCEL_URL=$(echo "$DEPLOY_OUTPUT" | grep -E "https://[a-zA-Z0-9\-]+\.vercel\.app" | tail -1 | tr -d ' ')

# ── 6. Env variables ──────────────────────────────────────────────────
echo ""
info "Синхронізую environment variables у Vercel..."

add_env() {
  local key="$1"
  local val
  val=$(grep "^${key}=" .env.local 2>/dev/null | head -1 | cut -d= -f2-)
  if [[ -n "$val" ]]; then
    printf '%s' "$val" | vercel env add "$key" production --force 2>/dev/null \
      && ok "  ✓ $key" \
      || info "  (вже є) $key"
  fi
}

add_env "DATABASE_URL"
add_env "NEXT_PUBLIC_MAPBOX_TOKEN"
add_env "VAPID_PUBLIC_KEY"
add_env "VAPID_PRIVATE_KEY"
add_env "VAPID_SUBJECT"

# NEXT_PUBLIC_APP_URL
if [[ -n "$VERCEL_URL" ]]; then
  printf '%s' "$VERCEL_URL" | vercel env add NEXT_PUBLIC_APP_URL production --force 2>/dev/null
  ok "  NEXT_PUBLIC_APP_URL=$VERCEL_URL"
fi

# ── 7. Фінальний деплой з env vars ───────────────────────────────────
echo ""
info "Фінальний деплой (з усіма змінними)..."
FINAL=$(vercel --prod --yes 2>&1)
FINAL_URL=$(echo "$FINAL" | grep -E "https://[a-zA-Z0-9\-]+\.vercel\.app" | tail -1 | tr -d ' ')
[[ -n "$FINAL_URL" ]] && VERCEL_URL="$FINAL_URL"

# ── Готово ────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}  Готово!${NC}"
echo ""
if [[ -n "$VERCEL_URL" ]]; then
  echo -e "  Сайт: ${BOLD}$VERCEL_URL${NC}"
fi
echo -e "  Dashboard: ${BOLD}https://vercel.com/dashboard${NC}"
echo ""
