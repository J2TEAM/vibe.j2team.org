import type { TechCategory, TechProfile } from '../types'

export const technologies: TechProfile[] = []

export const techMap = new Map<string, TechProfile>()

export const techsByCategory: Record<string, TechProfile[]> = {}

export const ALL_CATEGORIES: TechCategory[] = [
  'frontend',
  'backend',
  'database',
  'cache',
  'message-queue',
  'cdn',
  'load-balancer',
  'container',
  'monitoring',
  'ci-cd',
  'security',
  'storage',
]

export async function loadTechnologies(): Promise<void> {
  if (technologies.length) return
  const res = await fetch('/devops-challenge/technologies.json')
  const data = (await res.json()) as TechProfile[]
  technologies.push(...data)

  for (const tech of data) {
    techMap.set(tech.id, tech)
    const list = techsByCategory[tech.category]
    if (list) {
      list.push(tech)
    } else {
      techsByCategory[tech.category] = [tech]
    }
  }
}
