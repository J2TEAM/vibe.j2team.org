import { PlayerEnum } from '@/views/caro/types'
import type {
  Board,
  Direction,
  FinalScores,
  IPosition,
  ScoresByDirection,
  SumCol,
} from '@/views/caro/types'

export class AiService {
  private isInBoard(board: Board, row: number, col: number): boolean {
    const firstRow = board[0]
    return row >= 0 && row < board.length && col >= 0 && !!firstRow && col < firstRow.length
  }

  private isEmpty(board: Board): boolean {
    return board.every((row) => row.every((cell) => cell === null))
  }

  private getRandomCenterMove(board: Board): IPosition {
    const n = board.length
    const mid = Math.floor(n / 2)
    const row = Math.floor(Math.random() * 3) + (mid - 1)
    const col = Math.floor(Math.random() * 3) + (mid - 1)
    return { row, col }
  }

  /**
   * Move from a position in a given direction for a specified length,
   * adjusting if the target position is outside the board boundaries.
   */
  private march(
    board: Board,
    row: number,
    col: number,
    dy: number,
    dx: number,
    length: number,
  ): IPosition {
    let rowf = row + length * dy
    let colf = col + length * dx

    while (!this.isInBoard(board, rowf, colf)) {
      rowf -= dy
      colf -= dx
    }

    return { row: rowf, col: colf }
  }

  private positionToString(position: IPosition): string {
    return `${position.row},${position.col}`
  }

  private stringToPosition(str: string): IPosition {
    const parts = str.split(',')
    const row = Number(parts[0])
    const col = Number(parts[1])
    return { row, col }
  }

  /**
   * Generate all possible moves by finding empty positions adjacent to existing pieces.
   * This optimization reduces the search space by only considering relevant positions.
   */
  private getPossibleMoves(board: Board): Record<string, boolean> {
    const directions: Direction[] = this.getDirections()
    const taken: IPosition[] = this.getTakenPositions(board)
    const takenSet = this.buildTakenSet(taken)

    return this.findPossibleMoves(board, taken, takenSet, directions)
  }

  private getDirections(): Direction[] {
    return [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
      [1, 1],
      [-1, -1],
      [-1, 1],
      [1, -1],
    ]
  }

  private getTakenPositions(board: Board): IPosition[] {
    const taken: IPosition[] = []
    for (let r = 0; r < board.length; r++) {
      const row = board[r]
      if (!row) continue
      for (let c = 0; c < row.length; c++) {
        if (row[c] !== null) {
          taken.push({ row: r, col: c })
        }
      }
    }
    return taken
  }

  private buildTakenSet(taken: IPosition[]): Set<string> {
    return new Set(taken.map((pos) => this.positionToString(pos)))
  }

  private findPossibleMoves(
    board: Board,
    taken: IPosition[],
    takenSet: Set<string>,
    directions: Direction[],
  ): Record<string, boolean> {
    const possibleMoves: Record<string, boolean> = {}

    for (const [dy, dx] of directions) {
      for (const { row, col } of taken) {
        for (let length = 1; length < 5; length++) {
          const move = this.march(board, row, col, dy, dx, length)
          const moveStr = this.positionToString(move)

          if (!takenSet.has(moveStr) && !possibleMoves[moveStr]) {
            possibleMoves[moveStr] = true
          }
        }
      }
    }
    return possibleMoves
  }

  /**
   * Calculate score for a sequence of 5 cells.
   * @returns -1 if sequence is blocked by opponent, otherwise returns number of player's pieces.
   */
  private scoreOfList(list: (PlayerEnum | null)[], player: PlayerEnum): number {
    const blank = list.filter((p) => p === null).length
    const filled = list.filter((p) => p === player).length

    if (blank + filled < 5) {
      return -1 // Blocked by opponent
    }
    if (blank === 5) {
      return 0
    }
    return filled
  }

  /**
   * Extract a list of pieces along a straight line from start to end position.
   */
  private rowToList(
    board: Board,
    start: IPosition,
    dir: Direction,
    end: IPosition,
  ): (PlayerEnum | null)[] {
    const row: (PlayerEnum | null)[] = []
    let [currRow, currCol] = [start.row, start.col]
    const [dy, dx] = dir

    while (currRow !== end.row + dy || currCol !== end.col + dx) {
      const cell = board[currRow]?.[currCol]
      if (cell !== undefined) row.push(cell)
      currRow += dy
      currCol += dx
    }
    return row
  }

  /**
   * Calculate scores for all 5-cell sequences along a straight line.
   */
  private scoreOfRow(
    board: Board,
    start: IPosition,
    dir: Direction,
    end: IPosition,
    player: PlayerEnum,
  ): number[] {
    const colScores: number[] = []
    const row = this.rowToList(board, start, dir, end)

    if (row.length < 5) {
      return []
    }

    for (let i = 0; i <= row.length - 5; i++) {
      const fiveCells = row.slice(i, i + 5)
      const score = this.scoreOfList(fiveCells, player)
      colScores.push(score)
    }
    return colScores
  }

  /**
   * Convert raw score data into SumCol structure for easier processing.
   */
  private scoreReady(scoresByDirection: ScoresByDirection): SumCol {
    const sumCol: SumCol = { '0': {}, '1': {}, '2': {}, '3': {}, '4': {}, '5': {}, '-1': {} }

    for (const dir in scoresByDirection) {
      const scores = scoresByDirection[dir]
      if (!scores) continue
      for (const score of scores) {
        const key = String(score)
        const dirCounts = sumCol[key] ?? {}
        sumCol[key] = dirCounts
        dirCounts[dir] = (dirCounts[dir] ?? 0) + 1
      }
    }
    return sumCol
  }

  /**
   * Calculate scores around a position (row, col) in 4 directions.
   */
  private scoreOfColOne(board: Board, player: PlayerEnum, row: number, col: number): SumCol {
    const scores: ScoresByDirection = {}
    const directions: Direction[] = [
      [0, 1],
      [1, 0],
      [1, 1],
      [-1, 1],
    ]

    for (const [dy, dx] of directions) {
      const start = this.march(board, row, col, -dy, -dx, 4) // Move back 4 positions
      const end = this.march(board, row, col, dy, dx, 4) // Move forward 4 positions
      const dirKey = `${dy},${dx}`
      scores[dirKey] = this.scoreOfRow(board, start, [dy, dx], end, player)
    }

    return this.scoreReady(scores)
  }

  /**
   * Aggregate scores from different directions into final scores for each type.
   */
  private sumSumcolValues(sumcol: SumCol): FinalScores {
    const finalScores: FinalScores = {}
    for (const key in sumcol) {
      const score = Number.parseInt(key, 10)
      const dirCounts = sumcol[key]
      if (!dirCounts) continue
      if (score === 5) {
        // Only need 1 direction to form 5 for victory
        finalScores[String(score)] = Object.values(dirCounts).some((count: number) => count >= 1)
          ? 1
          : 0
      } else {
        finalScores[String(score)] = Object.values(dirCounts).reduce(
          (sum: number, count: number) => sum + count,
          0,
        )
      }
    }
    return finalScores
  }

  /**
   * Check for "double threat" 3-4 pattern, a very strong attacking position.
   * Has one sequence of 4 and one sequence of 3 in different directions.
   */
  private TF34Score(sumCol3: Record<string, number>, sumCol4: Record<string, number>): boolean {
    for (const dir4 in sumCol4) {
      if ((sumCol4[dir4] ?? 0) >= 1) {
        for (const dir3 in sumCol3) {
          if (dir3 !== dir4 && (sumCol3[dir3] ?? 0) >= 2) {
            return true
          }
        }
      }
    }
    return false
  }

  /**
   * Analyze SumCol to detect winning or near-winning situations.
   * @returns Threat level/opportunity from 0 (normal) to 5 (immediate win).
   */
  private winningSituation(sumcol: SumCol): number {
    const col5 = sumcol['5']
    if (col5 && Object.values(col5).some((count: number) => count >= 1)) {
      return 5
    }

    const col4 = sumcol['4']
    if (col4) {
      const num4sDirs = Object.keys(col4).length
      const max4sInOneDir = Math.max(0, ...Object.values(col4))
      if (num4sDirs >= 2 || max4sInOneDir >= 2) {
        return 4
      }
    }
    if (this.TF34Score(sumcol['3'] ?? {}, sumcol['4'] ?? {})) {
      return 4
    }

    const col3 = sumcol['3']
    if (col3) {
      const score3values = Object.values(col3).sort((a: number, b: number) => b - a)
      const a0 = score3values[0]
      const a1 = score3values[1]
      if (score3values.length >= 2 && (a0 ?? 0) >= 2 && (a1 ?? 0) >= 2) {
        return 3
      }
    }

    return 0
  }

  /**
   * Main evaluation function: calculate score for a move at (row, col).
   * Score combines offensive advantage and defensive benefits.
   */
  private stupidScore(
    board: Board,
    player: PlayerEnum,
    antiPlayer: PlayerEnum,
    row: number,
    col: number,
  ): number {
    const M = 1000
    let adv = 0 // Advantage points (offensive)
    let dis = 0 // Defense points (blocking)

    // 1. Calculate OFFENSIVE score: Assume we move to (row, col)
    const rowArr = board[row]
    if (rowArr) rowArr[col] = player
    const sumcolAttack = this.scoreOfColOne(board, player, row, col)
    const winningSitAttack = this.winningSituation(sumcolAttack)
    adv += winningSitAttack * M

    const finalScoresAttack = this.sumSumcolValues(sumcolAttack)
    adv +=
      (finalScoresAttack['-1'] ?? 0) +
      (finalScoresAttack['1'] ?? 0) +
      4 * (finalScoresAttack['2'] ?? 0) +
      8 * (finalScoresAttack['3'] ?? 0) +
      16 * (finalScoresAttack['4'] ?? 0)

    // 2. Calculate DEFENSIVE score: Assume opponent moves to (row, col)
    if (rowArr) rowArr[col] = antiPlayer
    const sumcolDefend = this.scoreOfColOne(board, antiPlayer, row, col)
    const winningSitDefend = this.winningSituation(sumcolDefend)
    dis += winningSitDefend * (M - 100) // Slightly prioritize blocking wins

    const finalScoresDefend = this.sumSumcolValues(sumcolDefend)
    dis +=
      (finalScoresDefend['-1'] ?? 0) +
      (finalScoresDefend['1'] ?? 0) +
      4 * (finalScoresDefend['2'] ?? 0) +
      8 * (finalScoresDefend['3'] ?? 0) +
      16 * (finalScoresDefend['4'] ?? 0)

    // 3. Clean up board
    if (rowArr) rowArr[col] = null

    return adv + dis
  }

  /**
   * Find and return the best move for the current player.
   */
  public bestMove(board: Board, player: PlayerEnum): IPosition {
    if (this.isEmpty(board)) {
      return this.getRandomCenterMove(board)
    }

    let maxScorePlayer: number | null = null
    let movePlayer: IPosition = { row: -1, col: -1 } // Initialize with invalid value

    const moves = this.getPossibleMoves(board)
    const antiPlayer = player === PlayerEnum.X ? PlayerEnum.O : PlayerEnum.X

    // If no feasible moves, return any empty cell (rare case)
    if (Object.keys(moves).length === 0) {
      for (let r = 0; r < board.length; r++) {
        const boardRow = board[r]
        if (!boardRow) continue
        for (let c = 0; c < boardRow.length; c++) {
          if (boardRow[c] === null) {
            return { row: r, col: c }
          }
        }
      }
    }

    for (const moveStr in moves) {
      const { row, col } = this.stringToPosition(moveStr)

      const scorePlayer = this.stupidScore(board, player, antiPlayer, row, col)

      if (maxScorePlayer === null || scorePlayer > maxScorePlayer) {
        maxScorePlayer = scorePlayer
        movePlayer = { row, col }
      }
    }

    return movePlayer
  }
}
