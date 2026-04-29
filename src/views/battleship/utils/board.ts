export type Cell = {
  ship: boolean
  hit: boolean
}

export const SIZE = 10

export function createBoard(): Cell[][] {
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({
      ship: false,
      hit: false,
    })),
  )
}

export function countAliveShipCells(board: Cell[][]): number {
  let count = 0
  for (const row of board) {
    for (const cell of row) {
      if (cell.ship && !cell.hit) count++
    }
  }
  return count
}

//   export function countAlive(board: Cell[][]) {
//     let alive = 0

//     for (const row of board) {
//       for (const cell of row) {
//         if (cell.hasShip && !cell.hit) alive++
//       }
//     }

//     return alive
//   }
