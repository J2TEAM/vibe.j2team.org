export type ShipShape = number[][]

export type Ship = {
  name: string
  shape: ShipShape
}

export const SHIPS: Ship[] = [
  { name: 'Destroyer', shape: [[1, 1]] },

  { name: 'Cruiser', shape: [[1, 1, 1]] },

  { name: 'Carrier', shape: [[1, 1, 1, 1, 1]] },

  {
    name: 'L Ship',
    shape: [
      [1, 0],
      [1, 0],
      [1, 1],
    ],
  },

  {
    name: 'T Ship',
    shape: [
      [1, 1, 1],
      [0, 1, 0],
    ],
  },
]
