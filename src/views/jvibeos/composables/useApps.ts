import type { CategoryId } from '@/data/categories'

export interface PageInfo {
  name: string
  description: string
  author: string
  path: string
  category: CategoryId
}

export interface AppItem extends PageInfo {
  views: number
  duration: number
  rating: number
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function processPages(pages: PageInfo[]): AppItem[] {
  return pages.map((page) => ({
    ...page,
    views: randomInt(100, 10000000),
    duration: randomInt(1, 60),
    rating: randomFloat(4.0, 5.0),
  }))
}

export function formatViews(views: number): string {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`
  }
  return views.toString()
}

export function formatDuration(minutes: number): string {
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:00`
  }
  return `${mins}:${randomInt(0, 59).toString().padStart(2, '0')}`
}
