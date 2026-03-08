# AGENTS.md

## Project Overview

vibe.j2team.org — A collaborative vibe coding project by J2TEAM Community with 55+ sub-pages. The homepage acts as a launcher linking to sub-pages, where each community member creates their own page.

## Tech Stack

- Vue 3.5 (Composition API with `<script setup>`)
- TypeScript (strict mode, `noUncheckedIndexedAccess: true`)
- Vite 7
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- Vue Router 5
- Pinia 3
- @unhead/vue (document head/meta management)

## Setup & Build

```sh
pnpm install
pnpm dev          # Dev server
pnpm build        # Type-check + production build
pnpm test:unit    # Unit tests with Vitest
pnpm lint         # Lint with oxlint + ESLint (with --fix)
pnpm lint:ci      # Lint without --fix (for CI)
pnpm format       # Format with oxfmt
```

## Project Structure

```
src/
  main.ts                    # App entry (createPinia + createHead + router)
  App.vue                    # Root component (<RouterView /> + useHead for dynamic meta)
  assets/main.css            # Tailwind CSS v4 @theme tokens + custom animations
  router/index.ts            # Vue Router — auto-generates routes from pages-loader
  types/page.ts              # PageMeta & PageInfo interfaces
  data/
    pages-loader.ts          # Auto-discovers views/*/meta.ts via import.meta.glob()
    categories.ts            # Category definitions (game, tool, fun, learn, spiritual, connect)
    homepage.ts              # Homepage content data (tech stack, rules, products)
    constants.ts             # Shared constants
  components/
    home/                    # Homepage section components (HeroSection, PagesGrid, etc.)
    BackToTop.vue
  stores/                    # Pinia stores (currently unused — pages manage state locally)
  views/
    HomePage.vue             # Landing page / launcher
    ContentPolicy.vue        # Content policy page
    NotFound.vue             # 404 page
    <app-name>/
      index.vue              # Each sub-page is a directory with index.vue
      meta.ts                # Page metadata — route auto-generated from folder name
```

## Auto-Routing System

Routes are auto-generated via `src/data/pages-loader.ts`:
- `import.meta.glob('@/views/*/meta.ts')` discovers all pages
- Path is derived from folder name (e.g., `src/views/my-app/` → `/my-app`)
- Featured pages are pinned to the top of the homepage (hand-picked list in pages-loader.ts)
- `hello-world` is always sorted last (template reference)

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
- Vietnamese text must use diacritics (tiếng Việt có dấu)

## Rules

1. **No database** — the project does not use any database in any form
2. **Always link back to homepage** — every sub-page must have a link back to the homepage (`/`)
3. **Language: Vietnamese (preferred) or English** — page content should be in Vietnamese or English
4. **No duplicate sub-apps** — check existing directories in `src/views/` before creating a new page
5. **Each sub-page is self-contained** — only work within your page's directory, do not modify shared files (`App.vue`, `main.css`, `router/index.ts`). Routes are auto-generated from the `meta.ts` file in each page directory
6. **Responsive** — pages must display well on mobile
7. **No new dependencies** in `package.json` unless truly needed and approved. However, the following libraries are **pre-approved** and can be used freely without additional approval:
   - `@vueuse/core` — Collection of 200+ Vue composables (useMouse, useClipboard, useDark, useStorage, etc.)
   - `@iconify/vue` — 200,000+ icons from 150+ icon sets in one component
   - `vue-konva` — 2D canvas library for drawing, games, and interactive graphics
   - `shiki` — Syntax highlighter
8. **Author attribution required** — every page must have an `author` field in its `meta.ts` file

## Adding a New Page

1. Create a new directory under `src/views/<your-page-name>/`
2. Add `index.vue` as the main component inside that directory
3. Add `meta.ts` exporting a `PageMeta` object with: `name`, `description`, `author`, and optionally `facebook` and `category`
4. Available categories: `game`, `tool`, `fun`, `learn`, `spiritual`, `connect`
5. The route is auto-generated from the folder name — no router changes needed

## Path Aliases

- `@/` resolves to `src/`

## Testing

- Framework: Vitest + Vue Test Utils + JSDOM
- Test files: `src/__tests__/`

## Linting & Formatting

- ESLint + eslint-plugin-vue + @vue/eslint-config-typescript
- Oxlint (Rust-based linter, runs before ESLint) — config in `.oxlintrc.json`
- Oxfmt for formatting — config in `.oxfmtrc.json` (no semicolons, single quotes)
- Prettier config exists for compatibility (eslint-config-prettier)
- Pre-commit: `simple-git-hooks` + `lint-staged` runs linters on staged files
