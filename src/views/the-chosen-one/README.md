# The Chosen One

A collection of mini-games that randomly select one name from a user-provided list. Each time you play, fate decides — no bias, no arguments. A new game is randomly chosen on every page load, or you can switch manually using the game picker buttons.

## Games

### 🎡 Spin the Wheel

A colorful prize wheel that spins and lands on a randomly selected name. Each participant gets their own color-coded segment. The wheel eases to a smooth stop, revealing the chosen one.

### 🦆 Duck Race

A lane-based race where each participant is represented by a uniquely costumed duck. Ducks race across the screen at randomised speeds with a swimming wobble animation. The first duck to cross the finish line wins. Costumes are inspired by pop culture, movies, and iconic characters:

| Costume | Costume | Costume | Costume |
|---------|---------|---------|---------|
| Wizard | Cowboy | Detective | Chef |
| Pirate | Ninja | Astronaut | Viking |
| Vampire | Princess | Robot | Samurai |
| Jedi | Zombie | Santa | Clown |
| Pharaoh | Knight | Hacker | Disco |

Each duck gets a unique SVG hat and accessory. Costumes are assigned by shuffling on every race.

### 🃏 Card Shuffle

A mystical card game where each participant is assigned a face-down card bearing an arcane sigil. The deck is shuffled with wild flying animations, then fanned out for selection. One card is drawn by fate — it flips face-up in a 3-D reveal, bursting with magical sparkles and particle effects to crown the chosen one.

**Magic theme highlights:**

- **Rotating rune circle** — an SVG magic circle with cardinal stars, tick marks, and a pentagram slowly rotates in the background during play
- **Ornate card backs** — each card features a detailed sigil (nested rings, 5-pointed star glyph, corner diamond ornaments) rendered in the project's dark navy palette
- **Jewel-tone glow per card** — every card has a unique accent color; the hover pulse ring, front face border, and winner glow all use that card's color
- **3-D perspective card flip** — the winning card flies to center stage and flips over with a smooth CSS `rotateY` transition
- **Particle burst on reveal** — canvas-based sparkles, stars, and diamonds explode from the card face in two waves when the winner is revealed
- **Interactive selection** — hover any face-down card to see its pulsing ring and "REVEAL" label, then click to draw fate

## Features

- **Up to 100 participants** — enter names one per line or comma-separated
- **Duplicate removal** — identical names are automatically de-duplicated
- **Live preview** — name chips update instantly as you type
- **Random game selection** — a different game is picked on each page load
- **Manual game switcher** — 🎡 / 🦆 / 🃏 buttons let you pick the game yourself
- **Confetti celebration** — winner announcement with a confetti burst
- **Spin/Race/Shuffle Again** — re-play without re-entering names
- **Responsive layout** — works on mobile and desktop

## How to Use

1. Open the app at `/the-chosen-one`
2. Enter names in the input box (one per line or comma-separated)
3. A game is automatically selected — or click 🎡 / 🦆 / 🃏 to choose
4. Click **SPIN** (wheel), **START RACE** (duck race), or **SHUFFLE** (card shuffle)
5. Watch the result and celebrate the winner
6. Click **Spin Again** / **Race Again** / **Shuffle Again** to replay

## Running Locally

**Prerequisites:** Node.js 18+

**Option 1 — pnpm (recommended)**

```sh
# Install pnpm if you don't have it
npm install -g pnpm

# Install dependencies (from the workspace root)
pnpm install

# Start the development server
pnpm dev
```

**Option 2 — npm + npx**

```sh
# Install dependencies
npm install

# Start the development server
npx vite
```

Then open **http://localhost:5173/the-chosen-one** in your browser.

> [!NOTE]
> If you use `npm install`, a `package-lock.json` will be generated. Do **not** commit it — this project uses `pnpm-lock.yaml` as the lockfile.

## Tech Stack

- **Vue 3** with `<script setup>` and Composition API
- **TypeScript** (strict mode)
- **Tailwind CSS v4** — project design tokens applied throughout
- **SVG** — wheel, duck costumes, card sigils, and magic circle rendered as inline SVG
- **Canvas API** — confetti effect on winner announcement; particle sparkles on card reveal
- `requestAnimationFrame` with `easeOutCubic` for smooth animations
- `ResizeObserver` — duck race track adapts to any screen width
- **CSS 3-D transforms** — `preserve-3d` + `rotateY` card flip on reveal

## Project Structure

```
src/views/the-chosen-one/
├── index.vue              # Main page — name input, game picker, winner modal, confetti
├── meta.ts                # Page metadata and route registration
├── types.ts               # MAX_NAMES constant, GameInfo type, AVAILABLE_GAMES registry
├── README.md              # This file
└── components/
    ├── SpinWheelGame.vue  # SVG spin wheel — accepts names[], emits winner
    ├── DuckRaceGame.vue   # Duck race — lane-based SVG ducks, accepts names[], emits winner
    └── CardShuffleGame.vue # Magic card shuffle — 3-D flip reveal with particle effects
```

## Extending with More Games

The app is designed to grow. To add a new game:

1. Create a component under `components/` (e.g., `SlotMachineGame.vue`)
2. The component must accept a `names: string[]` prop and emit `winner: [name: string]`
3. Expose a `spin()` method via `defineExpose({ spin })`
4. Add an entry to `AVAILABLE_GAMES` in `types.ts`
5. Add the `v-else-if` branch in `index.vue`'s game panel and a switcher emoji button

When multiple games exist, one is randomly selected on each page load.

## Author

**huynguyen260398** — [Facebook](https://www.facebook.com/huy.nguyen.682)

