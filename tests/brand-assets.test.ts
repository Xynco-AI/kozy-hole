import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import path from 'path'

const ROOT = path.join(__dirname, '..')
const BRAND = path.join(ROOT, 'public', 'brand')
const IMAGE = /\.(png|jpe?g|webp|avif|gif)$/i
const MAX_IMAGE_BYTES = 500 * 1024

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return sourceFiles(p)
    return /\.(tsx?|css)$/.test(e.name) ? [p] : []
  })
}

const referenced = new Set(
  ['app', 'components', 'lib']
    .flatMap(d => sourceFiles(path.join(ROOT, d)))
    .flatMap(f => readFileSync(f, 'utf8').match(/\/brand\/[\w.-]+/g) ?? []),
)

describe('brand assets', () => {
  it('every /brand/ path used in the code exists', () => {
    const missing = [...referenced].filter(p => !existsSync(path.join(ROOT, 'public', p)))
    expect(missing).toEqual([])
  })

  it(`brand images are web-sized (each under ${MAX_IMAGE_BYTES / 1024} KB)`, () => {
    const oversized = readdirSync(BRAND)
      .filter(f => IMAGE.test(f))
      .map(f => ({ f, kb: Math.round(statSync(path.join(BRAND, f)).size / 1024) }))
      .filter(({ kb }) => kb * 1024 > MAX_IMAGE_BYTES)
    expect(oversized).toEqual([])
  })

  it('no unused images are shipped in public/brand', () => {
    const unused = readdirSync(BRAND)
      .filter(f => IMAGE.test(f))
      .filter(f => !referenced.has(`/brand/${f}`))
    expect(unused).toEqual([])
  })
})
