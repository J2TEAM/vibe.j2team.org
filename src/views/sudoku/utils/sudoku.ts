export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'

export interface SudokuCell {
  row: number
  col: number
  value: number | null
  answer: number
  isClue: boolean
  isError: boolean
  notes: Set<number>
}

export type SudokuBoard = SudokuCell[][]

// Helper: check if a placement is valid
export function isValid(grid: number[][], row: number, col: number, num: number): boolean {
  for (let x = 0; x < 9; x++) {
    if (grid[row]![x] === num) return false
    if (grid[x]![col] === num) return false
  }
  const startRow = row - (row % 3)
  const startCol = col - (col % 3)
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[i + startRow]![j + startCol] === num) return false
    }
  }
  return true
}

// Generate base grid safely
function generateFullGrid(): number[][] {
  const grid = Array.from({ length: 9 }, () => Array(9).fill(0))

  const fillGrid = () => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row]![col] === 0) {
          const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5)
          for (const num of numbers) {
            if (isValid(grid, row, col, num)) {
              grid[row]![col] = num
              if (fillGrid()) return true
              grid[row]![col] = 0 // backtrack
            }
          }
          return false
        }
      }
    }
    return true
  }

  fillGrid()
  return grid
}

export function generateSudoku(difficulty: Difficulty): {
  board: SudokuBoard
  solution: number[][]
} {
  const solution = generateFullGrid()
  const puzzle = solution.map((row) => [...row])

  const attemptsByDifficulty = {
    easy: 35, // Remove 35 cells, keep 46
    medium: 45, // Remove 45 cells, keep 36
    hard: 52, // Remove 52 cells, keep 29
    expert: 58, // Remove 58 cells, keep 23
  }

  let removeCountTarget = attemptsByDifficulty[difficulty]

  const countSolutions = (grid: number[][]): number => {
    let count = 0
    const solveHelper = (row: number, col: number) => {
      if (row === 9) {
        count++
        return
      }
      if (grid[row]![col] !== 0) {
        solveHelper(col === 8 ? row + 1 : row, (col + 1) % 9)
        return
      }
      for (let num = 1; num <= 9; num++) {
        if (isValid(grid, row, col, num)) {
          grid[row]![col] = num
          solveHelper(col === 8 ? row + 1 : row, (col + 1) % 9)
          grid[row]![col] = 0
          if (count > 1) return // Max we ever care about is checking if > 1
        }
      }
    }
    solveHelper(0, 0)
    return count
  }

  let attempts = 15 // Stop infinite loops for hard cases

  while (removeCountTarget > 0 && attempts > 0) {
    const r = Math.floor(Math.random() * 9)
    const c = Math.floor(Math.random() * 9)
    if (puzzle[r]![c] !== 0) {
      const backup = puzzle[r]![c]!
      puzzle[r]![c] = 0

      const copyGrid = puzzle.map((row) => [...row])
      if (countSolutions(copyGrid) !== 1) {
        puzzle[r]![c] = backup // Restore, not uniquely solvable
        attempts--
      } else {
        removeCountTarget--
        attempts = 15 // Reset on success to keep trying randomly
      }
    }
  }

  const board: SudokuBoard = puzzle.map((row, r) =>
    row.map((val, c) => ({
      row: r,
      col: c,
      value: val === 0 ? null : val,
      answer: solution[r]![c]!,
      isClue: val !== 0,
      isError: false,
      notes: new Set<number>(),
    })),
  )

  return { board, solution }
}
