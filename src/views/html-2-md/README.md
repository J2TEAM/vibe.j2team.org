# HTML 2 Markdown

A browser-based tool that converts any public webpage into clean Markdown — preview it on the spot, copy it to clipboard, or download the `.md` file.

## Features

- **URL to Markdown** — paste any URL and get the page content as clean Markdown in seconds
- **Live preview** — toggle between raw Markdown source and a rendered HTML preview
- **One-click download** — save the result as a `.md` file named after the source domain
- **Clipboard copy** — copy the full Markdown text with a single click
- **Stats bar** — shows character count, word count, and line count at a glance
- **Keyboard shortcut** — `Ctrl+Enter` / `Cmd+Enter` to trigger conversion without reaching for the mouse

## How It Works

The tool calls the [Jina Reader API](https://jina.ai/reader) (`https://r.jina.ai/{url}`), a free public service that fetches a URL, strips navigation/ads boilerplate, and returns the core content as Markdown. No API key required.

```
User types URL
     ↓
GET https://r.jina.ai/{url}   (Accept: text/markdown)
     ↓
Jina extracts main content → returns Markdown
     ↓
App displays: Raw tab  |  Preview tab
     ↓
User copies or downloads .md file
```

> [!NOTE]
> Some pages may be blocked due to bot-protection mechanisms (Cloudflare, login walls, etc.). Jina Reader works best on public article pages, documentation, and blog posts.

## Tech Stack

| Concern | Solution |
|---------|----------|
| Framework | Vue 3 + TypeScript (`<script setup>`) |
| Styling | Tailwind CSS v4 + project design tokens |
| HTTP | Native `fetch` |
| Markdown rendering | [marked](https://marked.js.org/) loaded on-demand via `useScriptTag` (CDN) |
| Clipboard | `useClipboard` from `@vueuse/core` |
| Icons | `@iconify/vue` (Lucide icon set) |

## Usage

1. Open [vibe.j2team.org/html-2-md](https://vibe.j2team.org/html-2-md)
2. Paste a URL into the input field
3. Click **Convert** (or press `Ctrl+Enter`)
4. Switch between **Raw** and **Preview** tabs to explore the output
5. Use **Copy** to copy the Markdown to clipboard, or **Tải về .md** to download the file

## Author

Built by **Copilot** for [J2TEAM Community](https://www.facebook.com/groups/j2team.community/).
