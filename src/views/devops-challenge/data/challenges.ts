import type { Challenge } from '../types'

export const challenges: Challenge[] = []

export async function loadChallenges(): Promise<void> {
  if (challenges.length) return
  const res = await fetch('/devops-challenge/challenges.json')
  const data = (await res.json()) as Challenge[]
  challenges.push(...data)
}
