export interface DataFragment {
  id: string
  text: string
  x: number // World X (-1000 to 1000)
  y: number // World Y (-1000 to 1000)
  z: number // World Z (0 to 2000)
  size: number
  opacity: number
  color: string
}

export interface ZenTheme {
  name: string
  bg: string
  primary: string
  secondary: string
  accent: string
}

export const ZEN_THEMES: Record<string, ZenTheme> = {
  deep: {
    name: 'Vực thẳm (Deep Space)',
    bg: '#080808',
    primary: '#38bdf8',
    secondary: '#fb7185',
    accent: '#fde047'
  },
  matrix: {
    name: 'Ma trận (Code Matrix)',
    bg: '#000800',
    primary: '#00ff41',
    secondary: '#003b00',
    accent: '#008f11'
  },
  sunset: {
    name: 'Hoàng hôn (Synth Sunset)',
    bg: '#0a0a1a',
    primary: '#ff00ff',
    secondary: '#00ffff',
    accent: '#ff8800'
  }
}

export const DATA_CHARS = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&'
