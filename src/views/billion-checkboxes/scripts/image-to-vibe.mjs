import fs from 'fs'
import https from 'https'
import http from 'http'
import sharp from 'sharp'

const args = process.argv.slice(2)

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
1 Billion Checkboxes - Image to Vibe Code Converter
===================================================

Usage:
  node scripts/image-to-vibe.mjs <file-path-or-url> [options]

Options:
  --col=<number>     Starting column (X coordinate) [default: 1000]
  --row=<number>     Starting row (Y coordinate)    [default: 1000]
  --size=<number>    Max width/height in pixels     [default: 80]
  --invert           Invert colors (dark pixels become empty instead of checked)
  --threshold=<num>  Manual threshold 0-255         [default: auto-calculated]

Example:
  node scripts/image-to-vibe.mjs https://example.com/cat.jpg --col=500 --row=500 --size=100
  node scripts/image-to-vibe.mjs ./my-local-image.png --invert
`)
  process.exit(0)
}

// Parse arguments manually
const input = args[0]
let startCol = 1000
let startRow = 1000
let maxSize = 80
let invert = false
let manualThreshold = null

for (let i = 1; i < args.length; i++) {
  const arg = args[i]
  if (arg.startsWith('--col=')) startCol = parseInt(arg.split('=')[1], 10)
  if (arg.startsWith('--row=')) startRow = parseInt(arg.split('=')[1], 10)
  if (arg.startsWith('--size=')) maxSize = parseInt(arg.split('=')[1], 10)
  if (arg === '--invert') invert = true
  if (arg.startsWith('--threshold=')) manualThreshold = parseInt(arg.split('=')[1], 10)
}

const COLS = 31622

function encodeRLE(indicesArr) {
  const sorted = [...indicesArr].sort((a, b) => a - b)
  if (sorted.length === 0) return ''
  const encoded = []
  let start = sorted[0]
  let end = sorted[0]

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i]
    } else {
      encoded.push(start, end - start + 1)
      start = sorted[i]
      end = sorted[i]
    }
  }
  encoded.push(start, end - start + 1)

  if (encoded.length > 500000) {
    console.warn(
      `\n[WARNING] Image is incredibly complex! It generated ${encoded.length / 2} RLE sequences.`,
    )
    console.warn(
      `The browser might struggle to process this large of an import, but we'll generate the full code anyway.\n`,
    )
  }

  const limit = encoded.length // No artificial limit
  const bytes = new Uint8Array(limit * 4)
  for (let i = 0; i < limit; i++) {
    const val = encoded[i]
    bytes[i * 4] = val & 0xff
    bytes[i * 4 + 1] = (val >> 8) & 0xff
    bytes[i * 4 + 2] = (val >> 16) & 0xff
    bytes[i * 4 + 3] = (val >> 24) & 0xff
  }

  return Buffer.from(bytes).toString('base64')
}

async function processImage(buffer) {
  try {
    const { data, info } = await sharp(buffer)
      .resize(maxSize, maxSize, { fit: 'inside' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const width = info.width
    const height = info.height
    const indices = []

    // Calculate dynamic threshold if not provided
    let threshold = manualThreshold
    if (threshold === null) {
      let total = 0
      for (let i = 0; i < data.length; i++) {
        total += data[i]
      }
      threshold = (total / data.length) * 0.9 // Slightly darker than average
    }

    let checkedCount = 0

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x
        const pixel = data[idx]

        // By default, dark pixels are checked (black pen on white paper).
        // If invert is true, light pixels are checked.
        const isChecked = invert ? pixel >= threshold : pixel < threshold

        if (isChecked) {
          const gridIdx = (startRow + y) * COLS + (startCol + x)
          indices.push(gridIdx)
          checkedCount++
        }
      }
    }

    const encoded = encodeRLE(indices)
    console.log(`Successfully processed image (${width}x${height}).`)
    console.log(`Total checked pixels: ${checkedCount}`)
    console.log(`\nHere is your vibe code:\n`)
    console.log(encoded)
    console.log(`\n`)
  } catch (err) {
    console.error('Error processing image:', err.message)
  }
}

// Fetch or Read File
if (input.startsWith('http://') || input.startsWith('https://')) {
  const lib = input.startsWith('https') ? https : http
  console.log(`Downloading ${input}...`)
  lib
    .get(input, (res) => {
      if (res.statusCode !== 200) {
        console.error(`Failed to download image. Status Code: ${res.statusCode}`)
        return
      }
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => processImage(Buffer.concat(chunks)))
    })
    .on('error', (err) => {
      console.error('Error downloading image:', err.message)
    })
} else {
  if (!fs.existsSync(input)) {
    console.error(`File not found: ${input}`)
    process.exit(1)
  }
  processImage(fs.readFileSync(input))
}
