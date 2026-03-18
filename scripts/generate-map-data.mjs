/**
 * Generates public/data/blind-map-paths.json from source TypeScript.
 *
 * Workflow khi cập nhật bản đồ:
 *   1. Sửa vn.svg
 *   2. node tools/parse_svg_to_ts.cjs  → regenerate src/.../map-paths.ts
 *   3. node scripts/generate-map-data.mjs  → sync JSON cho production
 *
 * Lý do tồn tại script này:
 *   map-paths.ts (412 kB) không được Vite bundle trực tiếp nữa.
 *   Thay vào đó, dữ liệu được serve qua public/data/blind-map-paths.json
 *   và fetch lazy khi user vào trang /blind-map-challenge.
 *
 * Usage: node scripts/generate-map-data.mjs
 */

import { createJiti } from 'jiti'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const SOURCE = 'src/views/blind-map-challenge/data/map-paths.ts'

if (!existsSync(SOURCE)) {
  console.error(`Error: ${SOURCE} not found.`)
  console.error('Run "node tools/parse_svg_to_ts.cjs" first to regenerate it from vn.svg.')
  process.exit(1)
}

const jiti = createJiti(import.meta.url)

console.log('Generating public/data/blind-map-paths.json...')

const { mapPaths, vietnamOutline } = await jiti.import(resolve(SOURCE))

mkdirSync('public/data', { recursive: true })
writeFileSync('public/data/blind-map-paths.json', JSON.stringify({ mapPaths, vietnamOutline }))

console.log(`Done — ${mapPaths.length} provinces exported.`)
