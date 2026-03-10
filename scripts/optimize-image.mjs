import sharp from 'sharp'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { basename, extname } from 'node:path'

const MAX_WIDTH = 1920
const JPEG_QUALITY = 80
const PNG_EFFORT = 4
const WEBP_QUALITY = 80
const MIN_SIZE_BYTES = 10 * 1024

const files = process.argv.slice(2)

if (files.length === 0) {
  console.log('Usage: node scripts/optimize-image.mjs <file1> [file2] ...')
  process.exit(0)
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

for (const filePath of files) {
  const { size: beforeSize } = await stat(filePath)

  if (beforeSize < MIN_SIZE_BYTES) continue

  const ext = extname(filePath).toLowerCase()
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue

  const buffer = await readFile(filePath)
  let pipeline = sharp(buffer)
  const metadata = await pipeline.metadata()

  if (metadata.width && metadata.width > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true })
  }

  let output
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      output = await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer()
      break
    case '.png':
      output = await pipeline.png({ effort: PNG_EFFORT }).toBuffer()
      break
    case '.webp':
      output = await pipeline.webp({ quality: WEBP_QUALITY, effort: PNG_EFFORT }).toBuffer()
      break
    default:
      continue
  }

  if (output.length < beforeSize) {
    await writeFile(filePath, output)
    execFileSync('git', ['add', filePath])
    const saved = ((1 - output.length / beforeSize) * 100).toFixed(1)
    console.log(
      `[img] ${basename(filePath)}: ${formatBytes(beforeSize)} → ${formatBytes(output.length)} (-${saved}%)`,
    )
  }
}
