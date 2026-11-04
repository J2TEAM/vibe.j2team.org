import { describe, expect, it } from 'vitest'
import { dealGroups, parseNames } from './groups'

describe('chia nhóm', () => {
  it('drops blank lines and keeps the written names', () => {
    expect(parseNames(' An \n\n Bình \n')).toEqual(['An', 'Bình'])
  })

  it('deals a shuffled list so groups differ by at most one', () => {
    const groups = dealGroups(['An', 'Bình', 'Chi'], 2, () => 0)
    expect(groups).toEqual([['Bình', 'An'], ['Chi']])
    expect(groups[0]?.length).toBe(2)
    expect(groups[1]?.length).toBe(1)
  })

  it('does not invent empty groups when there are fewer names', () => {
    expect(dealGroups(['An'], 4, () => 0)).toEqual([['An']])
    expect(dealGroups([], 3)).toEqual([])
  })
})
