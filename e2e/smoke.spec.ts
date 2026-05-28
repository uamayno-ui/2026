/**
 * Mayno — E2E smoke tests
 * Tests the critical happy-path routes that must work for every deploy.
 * These are intentionally minimal — no real auth, no real API calls.
 */
import { test, expect } from '@playwright/test'

// ── Home ───────────────────────────────────────────────────────────────
test.describe('Home page', () => {
  test('loads and shows hero CTA', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Mayno/)
    // Primary green CTA button should be visible
    const cta = page.getByRole('link', { name: /карта|перевіри/i }).first()
    await expect(cta).toBeVisible()
  })

  test('has manifest link in <head>', async ({ page }) => {
    await page.goto('/')
    const manifest = page.locator('link[rel="manifest"]')
    await expect(manifest).toHaveCount(1)
  })
})

// ── Map ────────────────────────────────────────────────────────────────
test.describe('Map page', () => {
  test('loads without error', async ({ page }) => {
    await page.goto('/map')
    await expect(page).toHaveTitle(/Mayno/)
    // Left panel search box
    const searchBox = page.getByPlaceholder(/пошук|адрес/i)
    await expect(searchBox).toBeVisible()
  })

  test('shows layer toggle buttons', async ({ page }) => {
    await page.goto('/map')
    // At least Кадастр layer button
    await expect(page.getByText(/кадастр/i).first()).toBeVisible()
  })
})

// ── Pricing ───────────────────────────────────────────────────────────
test.describe('Pricing page', () => {
  test('shows plan cards', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page).toHaveTitle(/Тариф|Ціни|Mayno/i)
    // At least one plan card visible (Free)
    await expect(page.getByText(/безкоштовно|free/i).first()).toBeVisible()
  })

  test('shows services table', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByText(/витяг з дзк/i).first()).toBeVisible()
    await expect(page.getByText(/100 грн/i).first()).toBeVisible()
  })
})

// ── Login ────────────────────────────────────────────────────────────
test.describe('Login page', () => {
  test('shows Bank ID button', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/вхід|авторизаці/i)
    await expect(page.getByText(/bank id/i).first()).toBeVisible()
  })

  test('shows coming-soon alternatives', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText(/незабаром/i).first()).toBeVisible()
  })
})

// ── Parcel page ───────────────────────────────────────────────────────
test.describe('Parcel detail page', () => {
  const TEST_KADNUM = '3222486200:05:002:0054'

  test('loads parcel data', async ({ page }) => {
    await page.goto(`/parcel/${TEST_KADNUM}`)
    await expect(page).toHaveTitle(new RegExp(TEST_KADNUM.slice(0, 10)))
    await expect(page.getByText(TEST_KADNUM)).toBeVisible()
  })

  test('shows locked owner section', async ({ page }) => {
    await page.goto(`/parcel/${TEST_KADNUM}`)
    await expect(page.getByText(/потрібна авторизація/i)).toBeVisible()
  })

  test('has Schema.org JSON-LD', async ({ page }) => {
    await page.goto(`/parcel/${TEST_KADNUM}`)
    const ldJson = page.locator('script[type="application/ld+json"]')
    await expect(ldJson).toHaveCount(1)
    const content = await ldJson.textContent()
    expect(content).toContain('LandParcel')
    expect(content).toContain(TEST_KADNUM)
  })
})

// ── Cabinet redirect (unauthenticated) ────────────────────────────────
test.describe('Cabinet auth guard', () => {
  test('/app/overview redirects to /login for unauthenticated users', async ({ page }) => {
    await page.goto('/app/overview')
    // Should end up on /login (proxy redirect)
    await expect(page).toHaveURL(/\/login/)
  })
})

// ── PWA / Meta ────────────────────────────────────────────────────────
test.describe('PWA meta', () => {
  test('manifest is served', async ({ page }) => {
    const res = await page.goto('/manifest.webmanifest')
    expect(res?.status()).toBe(200)
    const json = await res?.json()
    expect(json.name).toMatch(/mayno/i)
    expect(json.display).toBe('standalone')
  })

  test('service worker JS is served', async ({ page }) => {
    const res = await page.goto('/sw.js')
    expect(res?.status()).toBe(200)
  })

  test('sitemap.xml is served', async ({ page }) => {
    const res = await page.goto('/sitemap.xml')
    expect(res?.status()).toBe(200)
    const text = await res?.text()
    expect(text).toContain('<urlset')
    expect(text).toContain('/map')
  })

  test('robots.txt is served', async ({ page }) => {
    const res = await page.goto('/robots.txt')
    expect(res?.status()).toBe(200)
    const text = await res?.text()
    expect(text).toContain('Disallow: /app/')
  })
})
