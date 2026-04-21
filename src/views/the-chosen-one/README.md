# The Chosen One

A collection of mini-games that randomly select one name from a user-provided list. Each time you play, fate decides — no bias, no arguments. A new game is randomly chosen on every page load, or you can switch manually using the game picker buttons.

## Games

### � Dice Roll

Three 3-D CSS dice tumble and clatter across the screen before landing on random faces. The winner is chosen by fate the moment you roll — the dice are pure visual spectacle.

**Dice highlights:**

- **True CSS 3-D cube** — all 6 faces placed with `transform-style: preserve-3d` and individual `translateZ` / `rotateX` / `rotateY` transforms
- **Pip faces 1–6** — each face renders its pips as inline SVG circles with a coral accent glow
- **Per-die stagger** — each die spins a different number of full rotations (7, 8, 9) so they don't stop simultaneously, making the roll feel organic
- **`easeOutQuart` deceleration** — a fast tumbling start slows into a satisfying locked landing driven by `requestAnimationFrame`
- **Flavour text** — "THE DICE ARE DECIDING…" pulses in amber while rolling

### �🎡 Spin the Wheel

A colorful prize wheel that spins and lands on a randomly selected name. Each participant gets their own color-coded segment. The wheel eases to a smooth stop, revealing the chosen one.

### 🦆 Duck Race

A lane-based race where each participant is represented by a uniquely costumed duck. Ducks race across the screen at randomised speeds with a swimming wobble animation. The first duck to cross the finish line wins. Costumes are inspired by pop culture, movies, and iconic characters:

| Costume | Costume  | Costume   | Costume |
| ------- | -------- | --------- | ------- |
| Wizard  | Cowboy   | Detective | Chef    |
| Pirate  | Ninja    | Astronaut | Viking  |
| Vampire | Princess | Robot     | Samurai |
| Jedi    | Zombie   | Santa     | Clown   |
| Pharaoh | Knight   | Hacker    | Disco   |

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

### 🎰 Lucky Jackpot

A classic slot machine with three spinning reels. Each reel displays participant names scrolling at high speed. Pull the lever (or click the button) and watch all three reels decelerate with staggered timing — the last reel stops with a satisfying bounce easing. When all three reels land on the same name, it's JACKPOT!

**Slot machine highlights:**

- **Retro machine shell** — full slot machine housing with a gradient top bar, decorative chase lights, and a coral-accented frame
- **3 independent reels** — each reel scrolls through names at different speeds with staggered stop times (2s, 2.6s, 3.2s) for suspense
- **Bounce easing on final reel** — the last reel uses `easeOutBounce` so it overshoots and settles, mimicking a mechanical stop
- **Chase lights** — 12 bulbs along the top blink alternately during spin and all illuminate on a win
- **Winner highlight bar** — a glowing coral bar pulses across the center row when the jackpot lands
- **Side lever with knob** — a clickable lever arm that animates a pull motion (hidden on mobile, where the button takes over)
- **Depth fading** — top and bottom of each reel viewport fade to dark, spotlighting the center winning row

## Features

- **Up to 100 participants** — enter names one per line or comma-separated
- **Duplicate removal** — identical names are automatically de-duplicated
- **Live preview** — name chips update instantly as you type
- **Random game selection** — a different game is picked on each page load
- **Manual game switcher** — 🎲 / 🎡 / 🦆 / 🃏 / 🦍 / 🎰 buttons let you pick the game yourself
- **Confetti celebration** — winner announcement with a confetti burst
- **Spin/Race/Roll/Shuffle Again** — re-play without re-entering names
- **Responsive layout** — works on mobile and desktop

## How to Use

1. Open the app at `/the-chosen-one`
2. Enter names in the input box (one per line or comma-separated)
3. A game is automatically selected — or click 🎲 / 🎡 / 🦆 / 🃏 / 🦍 / 🎰 to choose
4. Click **ROLL THE DICE** (dice roll), **SPIN** (wheel), **START RACE** (duck race), **SHUFFLE** (card shuffle), or **PULL THE LEVER** (jackpot)
5. Watch the result and celebrate the winner
6. Click **Roll Again** / **Spin Again** / **Race Again** / **Shuffle Again** to replay

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
- `requestAnimationFrame` with `easeOutCubic` / `easeOutQuart` for smooth animations
- `ResizeObserver` — duck race track adapts to any screen width
- **CSS 3-D transforms** — `preserve-3d` + `rotateY` card flip on reveal; full 6-face dice cube

## Project Structure

```
src/views/the-chosen-one/
├── index.vue              # Main page — name input, game picker, winner modal, confetti
├── meta.ts                # Page metadata and route registration
├── types.ts               # MAX_NAMES constant, GameInfo type, AVAILABLE_GAMES registry
├── README.md              # This file
└── components/
    ├── DiceRollGame.vue   # 3-D CSS dice — 3 tumbling cubes with pip faces, easeOutQuart roll
    ├── SpinWheelGame.vue  # SVG spin wheel — accepts names[], emits winner
    ├── DuckRaceGame.vue   # Duck race — lane-based SVG ducks, accepts names[], emits winner
    ├── CardShuffleGame.vue # Magic card shuffle — 3-D flip reveal with particle effects
    ├── KongBeautyGame.vue  # King Kong skyscraper climb race
    └── JackpotGame.vue     # Slot machine — 3 spinning reels with lever pull animation
```

## Extending with More Games

The app is designed to grow. To add a new game:

1. Create a component under `components/` (e.g., `SlotMachineGame.vue`)
2. The component must accept a `names: string[]` prop and emit `winner: [name: string]`
3. Expose a `spin()` method via `defineExpose({ spin })`
4. Add an entry to `AVAILABLE_GAMES` in `types.ts`
5. Add the `v-else-if` branch in `index.vue`'s game panel, a switcher emoji button, and a "Play Again" label

The maximum participant count is controlled by the `MAX_NAMES` constant in `types.ts` — increase it there to scale the limit across all games at once.

When multiple games exist, one is randomly selected on each page load.

## Author

**huynguyen260398** — [Facebook](https://www.facebook.com/huy.nguyen.682)

