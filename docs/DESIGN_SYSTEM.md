# Design System - vibe.j2team.org

Design direction: **Retro-Futuristic Editorial** — inspired by magazine/editorial design with warm tones, geometric shapes, and bold personality.

This document helps members create sub-pages that follow the project's shared visual language.

---

## Colors

All colors are defined in `src/assets/main.css` via Tailwind CSS v4's `@theme` block.

### Backgrounds

| Tailwind Token | Hex | Usage |
|----------------|-----|-------|
| `bg-bg-deep` | `#0F1923` | Primary background (full page) |
| `bg-bg-surface` | `#162232` | Cards, content blocks |
| `bg-bg-elevated` | `#1E2F42` | Hover states, elevated elements |

### Accents

| Tailwind Token | Hex | Usage |
|----------------|-----|-------|
| `text-accent-coral` / `bg-accent-coral` | `#FF6B4A` | Primary accent — headings, borders, CTAs |
| `text-accent-amber` / `bg-accent-amber` | `#FFB830` | Secondary accent — tech stack, code highlights |
| `text-accent-sky` / `bg-accent-sky` | `#38BDF8` | Tertiary accent — links, icons |

### Text

| Tailwind Token | Hex | Usage |
|----------------|-----|-------|
| `text-text-primary` | `#F0EDE6` | Primary text (warm off-white) |
| `text-text-secondary` | `#8B9DB5` | Descriptions, secondary text |
| `text-text-dim` | `#4A6180` | Metadata, less important info |

### Borders

| Tailwind Token | Hex | Usage |
|----------------|-----|-------|
| `border-border-default` | `#253549` | Default borders |
| `border-accent-coral` | `#FF6B4A` | Hover borders, emphasis |
| `border-accent-amber` | `#FFB830` | Tech stack hover borders |

### Color Rules

- **DO NOT** use purple or purple gradients — this is the generic vibe code aesthetic we intentionally avoid
- **DO NOT** use green-cyan gradients
- **DO NOT** use cold grays (`gray-950`, `gray-900`) — this project uses warm navy tones
- Coral (`#FF6B4A`) is the dominant accent, used for key visual anchors
- Amber (`#FFB830`) is the supporting accent, used for tech stack and code highlights
- For opacity, use Tailwind syntax: `bg-accent-coral/10`, `text-accent-amber/30`

---

## Typography

### Fonts

| Role | Font | Tailwind Class | Notes |
|------|------|----------------|-------|
| Display (headings) | **Anybody** | `font-display` | Geometric, bold, futuristic. Full Vietnamese support |
| Body (content) | **Be Vietnam Pro** | `font-body` | Designed specifically for Vietnamese. Default on `body` |

Fonts are loaded via Google Fonts in `index.html`:

```
Anybody: wght 500, 600, 700, 800
Be Vietnam Pro: wght 400, 500, 600
```

### Typography Scale

- **Hero title**: `font-display text-7xl md:text-8xl font-bold tracking-tight`
- **Section heading**: `font-display text-2xl font-semibold`
- **Card title**: `font-display text-lg font-semibold`
- **Body text**: `text-sm` or `text-lg` with `font-body` (default)
- **Metadata**: `text-xs text-text-dim font-display tracking-wide`
- **Section marker**: `font-display text-sm tracking-widest` with accent color (e.g. `//`)

---

## Layout

### Container

- Max width: `max-w-5xl` (1280px)
- Horizontal padding: `px-6`
- Centering: `mx-auto`

### Grids

- Page cards: `grid gap-5 sm:grid-cols-2 lg:grid-cols-3`
- Tech stack: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`
- Steps: `grid gap-8 sm:grid-cols-2`

### Card Style

Cards use sharp corners (no `rounded-*`) for the editorial feel:

```html
class="border border-border-default bg-bg-surface p-6
       transition-all duration-300
       hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated
       hover:shadow-lg hover:shadow-accent-coral/5"
```

**Important**: DO NOT use `rounded-xl` or `rounded-lg` on cards. Sharp corners are a defining trait of this design.

### Section Headings

Every section heading has a `//` marker prefix with an accent color:

```html
<h2 class="font-display text-2xl font-semibold text-text-primary mb-8
           flex items-center gap-3">
  <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
  Section Title
</h2>
```

Marker colors by section:
- Pages: `text-accent-coral`
- Tech Stack: `text-accent-amber`
- How to contribute: `text-accent-sky`

---

## Animations

### Fade Up (page load)

Use `animate-fade-up` combined with `animate-delay-{1-7}` (100ms increments):

```html
<div class="animate-fade-up animate-delay-3">
  <!-- Appears after 300ms -->
</div>
```

### Hover Effects

- **Card lift**: `hover:-translate-y-1` with `transition-all duration-300`
- **Coral border reveal**: `hover:border-l-4 hover:border-l-accent-coral`
- **Text color shift**: `group-hover:text-accent-coral transition-colors`
- **Shadow**: `hover:shadow-lg hover:shadow-accent-coral/5`

### Link Underline

Use `link-underline` for important links — underline slides in from left on hover:

```html
<a class="text-text-primary link-underline" href="...">Link text</a>
```

### Pulse Border

Use `animate-pulse-border` for placeholder cards — border pulses between default and coral.

---

## Decorative Elements

### Noise Overlay

A subtle grain texture covers the entire page at 2.5% opacity, creating a printed-paper feel. Already configured in `main.css` via `body::after`.

### Dot Divider

Small dot row separating hero from content:

```html
<div class="flex gap-1.5">
  <span v-for="n in 40" :key="n"
        class="w-1 h-1 rounded-full bg-border-default" />
</div>
```

### Background Number

Large faded ordinal number inside cards:

```html
<span class="absolute top-3 right-4 font-display text-6xl font-bold
             text-accent-amber/5 select-none pointer-events-none">
  01
</span>
```

### Issue Badge

"VOL.01 / 2026" label in top-right corner, slightly rotated:

```html
<div class="bg-accent-coral text-bg-deep font-display font-bold
            text-xs tracking-widest px-3 py-1.5 rotate-3">
  VOL.01 / 2026
</div>
```

---

## Guide for Members Creating Sub-Pages

When creating a new page in `src/views/<your-page>/index.vue`, follow these rules:

1. **Background**: Use `bg-bg-deep` as the main background
2. **Text**: Use `text-text-primary` for main text, `text-text-secondary` for secondary
3. **Fonts**: Use `font-display` for headings, `font-body` (default) for body text
4. **Accents**: Feel free to choose coral, amber, or sky as your page's accent color
5. **Cards/blocks**: Use `bg-bg-surface`, `border-border-default`, sharp corners
6. **Back link**: Reference the pattern in `src/views/hello-world/index.vue`

### Basic Page Template

```vue
<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body
              flex flex-col items-center justify-center px-4">
    <h1 class="font-display text-6xl font-bold text-accent-coral
               animate-fade-up">
      Page Title
    </h1>
    <p class="mt-4 text-text-secondary text-lg text-center max-w-md
              animate-fade-up animate-delay-2">
      Your page description.
    </p>
    <RouterLink
      to="/"
      class="mt-8 inline-flex items-center gap-2 border border-border-default
             bg-bg-surface px-5 py-2.5 text-sm text-text-secondary
             transition hover:border-accent-coral hover:text-text-primary
             animate-fade-up animate-delay-3"
    >
      &larr; Back to home
    </RouterLink>
  </div>
</template>
```

---

## Edge Toolbar

The EdgeToolbar (`src/components/EdgeToolbar.vue`) is a global component displayed on all sub-pages. It follows the design system:

- **Colors**: `bg-bg-elevated/90`, `text-text-secondary`, `border-border-default`, `text-accent-coral` (for favorited state)
- **Typography**: Labels use `font-display tracking-wide` (metadata pattern)
- **Corners**: Sharp corners (no border-radius) — consistent with the editorial design
- **Hover**: `text-text-primary` + `bg-bg-deep` on button hover
- **Opacity**: `opacity-50` when idle, `opacity-100` on hover — non-intrusive by default

Authors can disable the toolbar via `showToolbar: false` in `meta.ts` if it interferes with their page layout.

---

## Reference Files

| File | Contents |
|------|----------|
| `src/assets/main.css` | Design tokens (`@theme`), animations, utilities |
| `src/views/HomePage.vue` | Homepage — full design system example |
| `src/views/hello-world/index.vue` | Sample page — simple template |
| `index.html` | Google Fonts import |
