export function parseNames(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const next = items.slice()
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = next[index]
    const other = next[swapIndex]
    if (current === undefined || other === undefined) continue
    next[index] = other
    next[swapIndex] = current
  }
  return next
}

export function dealGroups(
  names: readonly string[],
  groupCount: number,
  random: () => number = Math.random,
): string[][] {
  if (!Number.isInteger(groupCount) || groupCount < 1) {
    throw new Error('Số nhóm phải là số nguyên dương')
  }
  if (names.length === 0) return []

  const size = Math.min(groupCount, names.length)
  const groups = Array.from({ length: size }, () => [] as string[])
  shuffle(names, random).forEach((name, index) => {
    groups[index % size]?.push(name)
  })
  return groups
}
