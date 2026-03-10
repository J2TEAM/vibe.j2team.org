import { createInterface } from 'node:readline/promises'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { stdin, stdout, argv, exit } from 'node:process'
import { parseArgs } from 'node:util'

const VIEWS_DIR = resolve(import.meta.dirname, '..', 'src', 'views')
const VALID_CATEGORIES = ['game', 'tool', 'fun', 'learn', 'spiritual', 'connect', 'other']
const KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const { values: flags, positionals } = parseArgs({
  args: argv.slice(2),
  options: {
    name: { type: 'string' },
    description: { type: 'string' },
    author: { type: 'string' },
    facebook: { type: 'string' },
    category: { type: 'string' },
  },
  allowPositionals: true,
})

const slug = positionals[0]

if (!slug) {
  console.error(
    'Usage: pnpm create:page <slug> [--name "..."] [--description "..."] [--author "..."] [--category game|tool|fun|learn|spiritual|connect|other] [--facebook "..."]',
  )
  exit(1)
}

if (!KEBAB_RE.test(slug)) {
  console.error(`Invalid slug "${slug}". Use lowercase kebab-case (e.g. my-cool-app).`)
  exit(1)
}

const pageDir = join(VIEWS_DIR, slug)

if (existsSync(pageDir)) {
  console.error(`Page "${slug}" already exists at src/views/${slug}/`)
  exit(1)
}

if (flags.category && !VALID_CATEGORIES.includes(flags.category)) {
  console.error(`Invalid category "${flags.category}". Must be one of: ${VALID_CATEGORIES.join(', ')}`)
  exit(1)
}

async function main() {
  let { name, description, author, facebook, category } = flags

  // Prompt only for missing fields
  const needsPrompt = !name || !description || !author || !category
  const rl = needsPrompt ? createInterface({ input: stdin, output: stdout }) : null

  try {
    if (!name) {
      name = (await rl.question('Display name: ')).trim()
      if (!name) {
        console.error('Display name is required.')
        exit(1)
      }
    }

    if (!description) {
      description = (await rl.question('Description: ')).trim()
      if (!description) {
        console.error('Description is required.')
        exit(1)
      }
    }

    if (!author) {
      author = (await rl.question('Author: ')).trim()
      if (!author) {
        console.error('Author is required.')
        exit(1)
      }
    }

    if (facebook === undefined && rl) {
      facebook = (await rl.question('Facebook URL (optional): ')).trim()
    }

    if (!category) {
      category = ''
      while (!VALID_CATEGORIES.includes(category)) {
        category = (await rl.question(`Category (${VALID_CATEGORIES.join('|')}): `)).trim()
      }
    }
  } finally {
    rl?.close()
  }

  // Build meta.ts
  const facebookLine = facebook ? `\n  facebook: '${facebook}',` : ''
  const metaContent = `import type { PageMeta } from '@/types/page'

const meta: PageMeta = {
  name: '${name}',
  description: '${description}',
  author: '${author}',${facebookLine}
  category: '${category}',
}

export default meta
`

  // Build index.vue
  const vueContent = `<script setup lang="ts">
// Start building your page here
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <h1 class="text-4xl font-bold">${name}</h1>
  </div>
</template>
`

  mkdirSync(pageDir, { recursive: true })
  writeFileSync(join(pageDir, 'meta.ts'), metaContent)
  writeFileSync(join(pageDir, 'index.vue'), vueContent)

  console.log(`\nPage created at src/views/${slug}/`)
  console.log('  - meta.ts')
  console.log('  - index.vue')
  console.log(`\nRun "pnpm dev" and visit /${slug} to see your page.`)
}

main()
