export interface ArticleSection {
  title: string
  content: string
  id: string
}

export interface ArticleTheme {
  primary: string
  secondary: string
  accent: string
  bg: string
  text: string
  selectionBg?: string
  selectionText?: string
}

export interface Decoration {
  emoji: string
  animation: 'bounce' | 'spin' | 'shiver' | 'pulse'
  position: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
}

export interface Article {
  title: string
  subtitle: string
  quote: string
  season: 'Xuân' | 'Hạ' | 'Thu' | 'Đông'
  theme: ArticleTheme
  decorations?: Decoration[]
  sections: ArticleSection[]
}
