export const MAX_NAMES = 100

export interface GameInfo {
  id: string
  name: string
  description: string
}

export const AVAILABLE_GAMES: readonly GameInfo[] = [
  {
    id: 'spin-wheel',
    name: 'Spin the Wheel',
    description: 'A colorful spinning wheel that lands on a random name',
  },
  {
    id: 'duck-race',
    name: 'Duck Race',
    description: 'Costumed ducks race across the screen — first to finish wins',
  },
  {
    id: 'card-shuffle',
    name: 'Card Shuffle',
    description: 'Mystical cards shuffle and one is drawn by fate to reveal the chosen one',
  },
  {
    id: 'kong-beauty',
    name: 'Kong & Beauty',
    description:
      'King Kongs race up a skyscraper — climbing, fighting, and falling — to claim the beauty at the top',
  },
] as const
