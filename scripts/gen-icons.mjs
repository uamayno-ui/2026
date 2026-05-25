/**
 * Generates PWA icons as PNG files placed in public/icons/.
 * Usage: node scripts/gen-icons.mjs
 * Requires: sharp (already installed as a Next.js dependency)
 */
import sharp from 'sharp'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'icons')
mkdirSync(OUT, { recursive: true })

function makeSvg(size, maskable = false) {
  const pad    = maskable ? Math.round(size * 0.15) : Math.round(size * 0.08)
  const inner  = size - pad * 2
  const r      = maskable ? 0 : Math.round(size * 0.22)
  const bg     = maskable ? '#22C55E' : '#0A0A0A'
  const letter = '#FFFFFF'

  const x = pad, y = pad, w = inner, h = inner
  const lw = Math.round(w * 0.14)

  const mPath = [
    `M ${x + w * 0.12} ${y + h * 0.15} L ${x + w * 0.12} ${y + h * 0.85} L ${x + w * 0.12 + lw} ${y + h * 0.85} L ${x + w * 0.12 + lw} ${y + h * 0.15} Z`,
    `M ${x + w * 0.12} ${y + h * 0.15} L ${x + w * 0.50} ${y + h * 0.55} L ${x + w * 0.50 + lw} ${y + h * 0.55} L ${x + w * 0.12 + lw} ${y + h * 0.15} Z`,
    `M ${x + w * 0.50} ${y + h * 0.55} L ${x + w * 0.88 - lw} ${y + h * 0.15} L ${x + w * 0.88} ${y + h * 0.15} L ${x + w * 0.50 + lw} ${y + h * 0.55} Z`,
    `M ${x + w * 0.88 - lw} ${y + h * 0.15} L ${x + w * 0.88 - lw} ${y + h * 0.85} L ${x + w * 0.88} ${y + h * 0.85} L ${x + w * 0.88} ${y + h * 0.15} Z`,
  ].join(' ')

  const bgShape = maskable
    ? `<rect width="${size}" height="${size}" fill="${bg}"/>`
    : `<rect width="${size}" height="${size}" rx="${r}" fill="${bg}"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bgShape}
  <path d="${mPath}" fill="${letter}"/>
</svg>`
}

const configs = [
  { name: 'icon-192.png',          size: 192, maskable: false },
  { name: 'icon-512.png',          size: 512, maskable: false },
  { name: 'icon-maskable-512.png', size: 512, maskable: true  },
]

for (const { name, size, maskable } of configs) {
  const svg = Buffer.from(makeSvg(size, maskable))
  const outPath = join(OUT, name)
  await sharp(svg).png().toFile(outPath)
  console.log(`✓ ${name}`)
}

console.log('\n✅ PWA icons written to public/icons/')
