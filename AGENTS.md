# AGENTS.md

## Project Overview

vibe.j2team.org - A collaborative vibe coding project by J2TEAM Community. The homepage acts as a launcher linking to sub-pages, where each community member creates their own page.

## Tech Stack

- Vue 3 (Composition API with `<script setup>`)
- TypeScript (strict mode)
- Vite
- Tailwind CSS v4
- Vue Router
- Pinia

## Setup & Build

```sh
pnpm install
pnpm dev          # Dev server
pnpm build        # Type-check + production build
pnpm test:unit    # Unit tests with Vitest
pnpm lint         # Lint with oxlint + ESLint
pnpm format       # Format with oxfmt
```

## Project Structure

```
src/
  main.ts                    # App entry point
  App.vue                    # Root component (only contains <RouterView />)
  assets/main.css            # Tailwind CSS entry
  router/index.ts            # Vue Router configuration
  stores/                    # Pinia stores
  views/
    HomePage.vue             # Landing page / launcher
    <app-name>/
      index.vue              # Each sub-page is a directory with index.vue
      meta.ts                # Page metadata (name, description, author) — route auto-generated
```

## Design System

**IMPORTANT**: All UI work MUST follow the design system documented in `docs/DESIGN_SYSTEM.md`.

Key rules:
- Use the custom color tokens defined in `src/assets/main.css` (`@theme` block) — never use raw Tailwind grays or default colors
- DO NOT use purple, green-cyan gradients, or cold grays (`gray-950`, `gray-900`)
- Fonts: `font-display` (Anybody) for headings, `font-body` (Be Vietnam Pro) for body text
- Cards use sharp corners (no `rounded-xl` or `rounded-lg`)
- Use `bg-bg-deep` as page background, `bg-bg-surface` for cards, `bg-bg-elevated` for hover states
- Accent colors: coral (`accent-coral`) as primary, amber (`accent-amber`) as secondary, sky (`accent-sky`) as tertiary
- Section headings use `//` marker prefix with accent color
- Use `animate-fade-up` with `animate-delay-{1-7}` for page load animations

Read `docs/DESIGN_SYSTEM.md` before making any visual changes.

## Code Conventions

- Use `<script setup lang="ts">` for all Vue components
- Do not use `class` in TypeScript unless absolutely necessary
- Do not use `any` or `unknown` types
- Use Composition API (not Options API)
- Use `pnpm` as package manager (not npm/yarn)
- Vietnamese text must use diacritics (tieng Viet co dau)

## Rules

1. **No database** — the project does not use any database in any form
2. **Always link back to homepage** — every sub-page must have a link back to the homepage (`/`)
3. **Language: Vietnamese (preferred) or English** — page content should be in Vietnamese or English
4. **No duplicate sub-apps** — check existing directories in `src/views/` before creating a new page
5. **Each sub-page is self-contained** — only work within your page's directory, do not modify shared files (`App.vue`, `main.css`, `router/index.ts`). Routes are auto-generated from the `meta.ts` file in each page directory
6. **Responsive** — pages must display well on mobile
7. **No new dependencies** in `package.json` unless truly needed and approved
8. **Author attribution required** — every page must have an `author` field in its `meta.ts` file

## Adding a New Page

1. Create a new directory under `src/views/<your-page-name>/`
2. Add `index.vue` as the main component inside that directory
3. Add `meta.ts` with page info (name, description, author) — the route is auto-generated from this file

## Path Aliases

- `@/` resolves to `src/`

## Testing

- Framework: Vitest + Vue Test Utils + JSDOM
- Test files: `src/__tests__/`

## Linting & Formatting

- ESLint + eslint-plugin-vue + @vue/eslint-config-typescript
- Oxlint (Rust-based linter, runs before ESLint)
- Oxfmt for formatting
- Prettier config exists for compatibility (eslint-config-prettier)
