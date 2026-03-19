# AGENTS.md

## Project Overview

vibe.j2team.org — A collaborative vibe coding project by J2TEAM Community with 190+ sub-apps. The homepage acts as a launcher linking to sub-apps, where each community member creates their own page.

## Tech Stack

- Vue 3.5 (Composition API with `<script setup>`)
- TypeScript (strict mode, `noUncheckedIndexedAccess: true`)
- Vite 7
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- Vue Router 5
- Pinia 3
- @unhead/vue 2 (document head/meta management)
- @vueuse/core 14 — 200+ Vue composables (useMouse, useClipboard, useDark, useStorage, useIntersectionObserver, useLocalStorage, useMediaQuery, useWindowSize, etc.)
- @iconify/vue 5 — 200,000+ icons from 150+ icon sets via `<Icon icon="icon-set:icon-name" />` component
- html-to-image — capture DOM nodes as PNG/JPEG/SVG
- shiki 4 — syntax highlighting

## Setup & Build

```sh
pnpm install
pnpm dev          # Dev server
pnpm build        # Type-check + production build (+ OG pages + sitemap generation)
pnpm test:unit    # Unit tests with Vitest
pnpm lint         # Lint with oxlint + ESLint (with --fix)
pnpm lint:ci      # Lint without --fix (for CI)
pnpm format       # Format with oxfmt
pnpm create:page <slug>  # Scaffold a new page (interactive or with flags)
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
    pages-loader.ts          # Fetches pre-generated pages.json (built by Vite plugin)
    categories.ts            # Category definitions (game, tool, creative, fun, learn, health, finance, spiritual, connect, other)
    authors.ts               # Author aggregation from pages (leaderboard, author pages)
    homepage.ts              # Homepage content data (tech stack, rules, products)
    constants.ts             # Shared constants
  components/
    home/                    # Homepage section components (HeroSection, PagesGrid, etc.)
    BackToTop.vue
    EdgeToolbar.vue          # Slide-out toolbar on sub-pages (source link, bookmark, home, comments)
    ErrorBoundary.vue        # Error boundary wrapper
    FavoriteButton.vue       # Bookmark/favorite toggle button
    GiscusModal.vue          # Giscus comments modal (per-page discussions)
  composables/
    useFavorites.ts          # Bookmark/favorite state (localStorage via VueUse)
    useDraggable.ts          # Drag behavior composable
  stores/                    # Pinia stores (currently unused — pages manage state locally)
  views/
    HomePage.vue             # Landing page / launcher
    ContentPolicy.vue        # Content policy page
    LeaderboardPage.vue      # Author leaderboard (/leaderboard)
    BookmarksPage.vue        # User's bookmarked pages (/bookmarks)
    AuthorPage.vue           # Author profile page (/author/:slug)
    NotFound.vue             # 404 page
    <app-name>/
      index.vue              # Each sub-page is a directory with index.vue
      meta.ts                # Page metadata — route auto-generated from folder name
```

## Auto-Routing System

Routes are auto-generated from a pre-built `public/data/pages.json` file:
- A Vite plugin (`scripts/generate-pages-json.mjs`) scans all `src/views/*/meta.ts` files and writes `public/data/pages.json` at build start and whenever a `meta.ts` file changes during dev
- Post-build scripts generate OG image pages (`scripts/generate-og-pages.mjs`) and sitemap with sub-sitemaps + robots.txt (`scripts/generate-sitemap.mjs`)
- `src/data/pages-loader.ts` fetches this JSON at runtime (bypasses Rollup bundling)
- Path is derived from folder name (e.g., `src/views/my-app/` → `/my-app`)
- Featured pages are hand-picked in `scripts/generate-pages-json.mjs` and pinned to top of homepage
- Pages with `hidden: true` in their `meta.ts` are excluded from the listing but their routes still work

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

## Leveraging Installed Libraries

### @vueuse/core (MUST use before writing custom code)

Before implementing any browser/DOM/state logic, **check if VueUse already has a composable for it**. Common composables to use instead of custom code:

- **Storage**: `useLocalStorage()`, `useSessionStorage()` — not `localStorage.getItem/setItem`
- **DOM events**: `useEventListener()` — not manual `addEventListener/removeEventListener`
- **Clipboard**: `useClipboard()` — not `navigator.clipboard` directly
- **Dark mode**: `useDark()`, `useColorMode()` — not manual class toggling
- **Timers**: `useInterval()`, `useTimeout()`, `useIntervalFn()` — not raw `setInterval/setTimeout`
- **Mouse/Touch**: `useMouse()`, `usePointer()`, `useSwipe()` — not manual event handlers
- **Viewport**: `useWindowSize()`, `useElementSize()`, `useIntersectionObserver()` — not manual resize/scroll listeners
- **Media**: `useMediaQuery()` — not `window.matchMedia` directly
- **Network**: `useFetch()`, `useOnline()` — not raw `fetch` with manual reactive state
- **Remote scripts**: `useScriptTag()` — not manual `document.createElement('script')`. Auto-cleans up on unmount
- **Animation**: `useTransition()`, `useRafFn()` — not manual `requestAnimationFrame`
- **Reactivity**: `watchDebounced()`, `watchThrottled()`, `refDebounced()` — not custom debounce/throttle implementations

Full list: https://vueuse.org/functions.html

**Live reference**: See `src/views/hello-world/index.vue` for interactive demos of the composables listed above.

### @iconify/vue (MUST use for all icons)

Use the `<Icon>` component for all icons instead of inline SVGs, emoji characters, or custom icon components:

```vue
<script setup lang="ts">
import { Icon } from '@iconify/vue'
</script>

<template>
  <Icon icon="mdi:home" />
  <Icon icon="heroicons:arrow-left" class="size-5" />
  <Icon icon="lucide:settings" :width="24" />
</template>
```

**Preferred icon set: `lucide`** (e.g., `lucide:home`, `lucide:settings`, `lucide:arrow-left`). Only use other sets (`mdi`, `heroicons`, `ph`, `tabler`, `ri`, `solar`, `ion`) if Lucide doesn't have the needed icon. Browse at https://icon-sets.iconify.design/

**Live reference**: See `src/views/hello-world/index.vue` for icon usage examples across multiple icon sets.

## Code Conventions

- Use `<script setup lang="ts">` for all Vue components
- Do not use `class` in TypeScript unless absolutely necessary
- Do not use `any` or `unknown` types
- Use Composition API (not Options API)
- Use `pnpm` as package manager (not npm/yarn)
- Vietnamese text must use diacritics (tiếng Việt có dấu)

## Pre-Implementation Checklist

Before implementing any new feature or sub-page, agents MUST:

1. **Check local `src/views/`** — List existing directories in `src/views/` to see if the same or similar page already exists locally
2. **Check existing pages on main branch** — Browse https://github.com/J2TEAM/vibe.j2team.org/tree/main/src/views to see if someone has already built the same or similar feature
3. **Check open Pull Requests** — Browse https://github.com/J2TEAM/vibe.j2team.org/pulls to see if someone is already working on it
4. **Only proceed if no duplicates found** — If the feature already exists locally, on main, or in an open PR, report back to the user instead of building a duplicate

## Rules

1. **No database** — the project does not use any database in any form
2. **Always link back to homepage** — every sub-page must have a link back to the homepage (`/`)
3. **Language: Vietnamese (preferred) or English** — page content should be in Vietnamese or English
4. **No duplicate sub-apps** — check existing directories in `src/views/` before creating a new page
5. **Each sub-page is self-contained** — only work within your page's directory (`src/views/<app-name>/`), do not modify shared files (`App.vue`, `main.css`, `router/index.ts`). Routes are auto-generated from the `meta.ts` file in each page directory. **Exception:** static assets can be placed in `public/<app-name>/` (see "Static Assets Convention" below)
6. **Responsive** — pages must display well on mobile
7. **No new dependencies** in `package.json` unless truly needed and approved. The following libraries are **already installed** — use them freely (see "Leveraging Installed Libraries" section above):
   - `@vueuse/core` — Vue composables
   - `@iconify/vue` — Icon component
   - `html-to-image` — DOM-to-image capture (PNG/JPEG/SVG)
   - `shiki` — Syntax highlighter

   The following are **pre-approved** and can be added without additional approval:
   - `vue-konva` — 2D canvas library for drawing, games, and interactive graphics
8. **Folder names must be kebab-case** — sub-page directories under `src/views/` must use lowercase kebab-case (e.g., `my-app`, `dev-rpg`). PascalCase or mixed-case folder names are not allowed
9. **Author attribution required** — every page must have an `author` field in its `meta.ts` file
10. **External libraries & APIs are welcome** — Sub-apps can load third-party JS libraries at runtime via `useScriptTag()` from `@vueuse/core` (e.g., YouTube IFrame API, Tone.js, Matter.js, p5.js). Authors can also call free/public external APIs (e.g., weather, dictionary, trivia, exchange rates) to power their features — just don't hard-code API keys in source code (see rule 8 in PR Checklist)
11. **No landing pages or promotional content** — Pages must provide direct, self-contained value to users (e.g., a game, tool, interactive experience, or educational content). The following are **not accepted**:
   - Landing pages or showcase pages for external products, services, or brands
   - Pages whose primary purpose is to redirect users to external websites or services
   - Advertising, marketing, or affiliate content
   - Portfolio/brochure pages that only display static information about an external entity

## Recommended Internal Structure

For apps with 4+ files, follow this recommended structure inside `src/views/<app-name>/`:

```
src/views/<app-name>/
  index.vue              # Required: page entry point
  meta.ts                # Required: page metadata
  components/            # Recommended: Vue components used by the page
  composables/           # Recommended: composition functions (use-*.ts)
  types.ts               # Recommended: TypeScript type definitions
  utils/                 # Recommended: pure utility functions
  assets/                # Recommended: images, sounds, CSS (processed by Vite)
```

Simple apps (just a single page) only need `index.vue` + `meta.ts`.

### Static Assets Convention

- `src/views/<app-name>/assets/` — small images, sounds, CSS that Vite will hash and optimize. **Use this for small assets (< 50 kB total).**
- `public/<app-name>/` — large or numerous assets (sprite sheets, image sets, audio files, videos, JSON data) served as-is without Vite processing. Accessible at `/<app-name>/filename.ext`. **You are allowed and encouraged to create `public/<app-name>/` directories** — this is NOT limited to your `src/views/` folder.
- `public/shared/` — assets used by multiple apps (e.g. `noise.webp`, `web-logo.svg`). Accessible at `/shared/filename.ext`.
- `public/data/pages.json` — auto-generated app registry (globally shared). **Do NOT place app-specific data here** — use `public/<app-name>/` instead.

**Important:** All app-specific public assets (images, sounds, data files) go in `public/<app-name>/`. Do NOT use `public/images/`, `public/sounds/`, or `public/data/` for app-specific assets.

**Why use `public/`?** Assets imported via `import` or `import.meta.glob` in `src/` get bundled into JS chunks, increasing initial page load. Files in `public/` are served as static files and loaded on demand by the browser.

### Bundle Size — Avoid bloating JS chunks

Vite/Rollup bundles **everything that is `import`ed** into JS chunks. The following patterns bloat the bundle and **must be avoided**:

**DO NOT — Export large data as a TypeScript/JS module:**
```ts
// Whether static or dynamic import — Rollup still creates a JS chunk
export const wordList = { ... } // 500 kB
const mod = await import('./data') // still a JS chunk
```

**DO — Replace with JSON in `public/<app-name>/` + lazy fetch:**
```ts
// Bypasses Rollup entirely, browser caches it independently
const response = await fetch('/my-app/my-app-data.json')
const data = await response.json()
```

**DO NOT — Import a compiled engine (.js Emscripten/WASM) via `?url`:**
```ts
import engineUrl from './engine.js?url' // Vite still copies it to dist/assets/, triggers warning
```

**DO — Place in `public/<app-name>/` and use a hardcoded URL:**
```ts
const engineUrl = '/my-app/engine.js' // Rollup never touches it
```

**Size thresholds:**

| Data type | Threshold | Recommendation |
|-----------|-----------|----------------|
| Dictionary / word list | > 50 kB | `public/<app>/data.json` + fetch |
| Geo / SVG path data | > 50 kB | `public/<app>/data.json` + fetch |
| Sprite frames / image sets | > 10 files or > 50 kB total | `public/<app>/` + URL strings |
| Compiled engine (Emscripten, asm.js) | any size | `public/<app>/` + hardcoded URL |
| Config / small data | < 20 kB | Direct import is fine |

After building, run `pnpm build` and verify there are no `(!) Some chunks are larger than 500 kB` warnings.

### Shared Utilities (opt-in)

Reusable code used by 3+ apps can live in the shared layer:

```
src/components/shared/     # Shared UI components
src/composables/shared/    # Shared composables
src/utils/shared/          # Shared utility functions
```

Apps can import from these directories but are never required to. Each app remains self-contained by default.

## Adding a New Page

Run the generator script:

```sh
# Interactive (prompts for missing fields)
pnpm create:page <slug>

# Non-interactive (all fields via flags — use this in scripts and AI agents)
pnpm create:page <slug> --name "Display Name" --description "Page description" --author "Author" --category game [--facebook "https://..."] [--hide-toolbar] [--hidden]
```

Available categories: `game`, `tool`, `creative`, `fun`, `learn`, `health`, `finance`, `spiritual`, `connect`, `other`.

This creates `src/views/<slug>/index.vue` + `meta.ts` with the correct structure. Any flag not provided will be prompted interactively.

**Manual alternative** (if not using the script):

1. Create a new directory under `src/views/<your-page-name>/`
2. Add `index.vue` as the main component inside that directory
3. Add `meta.ts` exporting a `PageMeta` object with: `name`, `description`, `author`, `category`, and optionally `facebook`, `showToolbar`, `hidden`
4. Available categories: `game`, `tool`, `creative`, `fun`, `learn`, `health`, `finance`, `spiritual`, `connect`, `other`
5. The route is auto-generated from the folder name — no router changes needed

## Edge Toolbar

An **EdgeToolbar** (`src/components/EdgeToolbar.vue`) is displayed on all sub-pages by default. It slides out from the right edge of the screen on hover and provides:

- **View source code** — link to the page's source on GitHub
- **Bookmark** — add/remove the page from favorites (persisted in localStorage)
- **Home** — navigate back to the homepage
- **Dismiss** — hide the toolbar for the current session (reappears on page reload)

### Behavior

- The trigger tab is flush to the right edge of the viewport, semi-transparent (`opacity-50`) when idle
- On hover, it becomes fully opaque and the panel slides out with button labels
- The toolbar is rendered in `App.vue` outside `<RouterView>`, so it's independent of sub-page content
- Uses scoped styles and design system tokens (`bg-bg-elevated`, `text-text-secondary`, `border-border-default`, `font-display`)

### Opting out

Authors can disable the toolbar on their page if it interferes with their layout (e.g., a full-screen game). Add `showToolbar: false` to your `meta.ts`:

```ts
import type { PageMeta } from '@/types/page'

const meta: PageMeta = {
  name: 'My Page',
  description: '...',
  author: 'Author',
  category: 'game',
  showToolbar: false, // Disable the edge toolbar on this page
}

export default meta
```

Default is `true` — the toolbar is shown unless explicitly disabled.

## Path Aliases

- `@/` resolves to `src/`

## Testing

- Framework: Vitest + Vue Test Utils + JSDOM
- Test files: `src/__tests__/`

## PR Checklist (MUST pass before creating PR)

1. **CI must pass** — Run `pnpm build` (type-check + build) and `pnpm lint:ci` locally before pushing. Do NOT create a PR with failing CI
2. **No unused code** — Remove variables, constants, imports, and type definitions that are not actually used. Do not define constants and then hard-code values instead of using them
3. **Use `RouterLink` for internal navigation** — Never use raw `<a>` tags for links within the app. Use Vue Router's `<RouterLink :to="...">` instead. Refer to existing pages for examples
4. **Do not redefine shared types** — Import types like `PageMeta` from the shared `types.ts` or `@/types/page` instead of redefining them in your files
5. **Only commit `pnpm-lock.yaml`** — Do not commit `package-lock.json` or `yarn.lock`
6. **UTF-8 encoding** — Ensure all Vietnamese text is properly encoded in UTF-8 (no garbled characters)
7. **Follow `meta.ts` structure** — Copy the pattern from `src/views/hello-world/meta.ts` exactly. Import `PageMeta` type, export default with required fields
8. **No exposed API endpoints/secrets** — Since this is open source, never hard-code API keys, endpoints, or secrets in the source code
9. **No large data files in `src/`** — If your app needs a large data file (> 50 kB), place it in `public/<app-name>/` as JSON and fetch it lazily. Do NOT export it as a TypeScript/JS module. See "Bundle Size — Avoid bloating JS chunks" section above
10. **Clean up side effects on unmount** — Every `addEventListener`, `setInterval`, `setTimeout`, `requestAnimationFrame`, or any other global side effect registered in `onMounted` MUST be cleaned up in `onUnmounted`. Prefer VueUse composables (`useEventListener`, `useIntervalFn`, `useTimeoutFn`, `useRafFn`) which handle cleanup automatically. Forgetting cleanup causes memory leaks and ghost listeners that persist across route navigations in an SPA

## Linting & Formatting

- ESLint + eslint-plugin-vue + @vue/eslint-config-typescript
- Oxlint (Rust-based linter, runs before ESLint) — config in `.oxlintrc.json`
- Oxfmt for formatting — config in `.oxfmtrc.json` (no semicolons, single quotes)
- Prettier config exists for compatibility (eslint-config-prettier)
- Commitlint with `@commitlint/config-conventional` — commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/) format (e.g., `feat:`, `fix:`, `chore:`)
- Pre-commit: `simple-git-hooks` + `lint-staged` runs linters on staged files and auto-optimizes images (`.png`, `.jpg`, `.jpeg`, `.webp`) via `sharp`

### Oxfmt & Vue template expressions

**Do NOT write multiple statements inline in Vue template event handlers** (e.g., `@click`). Oxfmt strips semicolons during formatting, which causes the Vue compiler to fail with a syntax error because the two statements merge into an invalid expression.

```vue
<!-- BAD — oxfmt strips semicolons → build error -->
<button @click="doA(); doB()">Click</button>

<!-- GOOD — extract to a function -->
<button @click="handleClick">Click</button>
```

```ts
function handleClick() {
  doA()
  doB()
}
```
