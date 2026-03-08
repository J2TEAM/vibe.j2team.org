export interface BlogSection {
  heading: string
  paragraphs: string[]
}

export interface BlogImageLink {
  label: string
  url: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  author: string
  publishedAt: string
  updatedAt?: string
  tags: string[]
  readMinutes: number
  coverImageUrl?: string
  coverImageAlt?: string
  imageLinks?: BlogImageLink[]
  sections: BlogSection[]
}
