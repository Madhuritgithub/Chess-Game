import { Board, Position, ChessPiece, PieceColor } from "../types/chess"

export function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8
}

/**
 * Gets all pseudo-legal moves for a piece (moves that are physically possible,
 * disregarding check rules).
 */
export function getPseudoLegalMoves(
  piece: ChessPiece,
  fromRow: number,
  fromCol: number,
  board: Board,
  enPassantTarget: Position | null = null
): Position[] {
  const moves: Position[] = []
  const { type, color } = piece

  const addMove = (row: number, col: number) => {
    if (isValidPosition(row, col)) {
      const targetPiece = board[row][col]
      if (!targetPiece) {
        moves.push({ row, col })
        return true // continue sliding
      } else {
        if (targetPiece.color !== color) {
          moves.push({ row, col })
        }
        return false // blocked
      }
    }
    return false
  }

  switch (type) {
    case "pawn": {
      const direction = color === "white" ? -1 : 1
      const startRow = color === "white" ? 6 : 1

      // Single step forward
      const nextRow = fromRow + direction
      if (isValidPosition(nextRow, fromCol) && !board[nextRow][fromCol]) {
        moves.push({ row: nextRow, col: fromCol })

        // Double step forward from starting rank
        const doubleRow = fromRow + 2 * direction
        if (fromRow === startRow && isValidPosition(doubleRow, fromCol) && !board[doubleRow][fromCol]) {
          moves.push({ row: doubleRow, col: fromCol })
        }
      }

      // Standard diagonal captures
      for (const colOffset of [-1, 1]) {
        const captureRow = fromRow + direction
        const captureCol = fromCol + colOffset
        if (isValidPosition(captureRow, captureCol)) {
          const targetPiece = board[captureRow][captureCol]
          if (targetPiece && targetPiece.color !== color) {
            moves.push({ row: captureRow, col: captureCol })
          }
        }
      }

      // En Passant capture
      if (enPassantTarget && Math.abs(enPassantTarget.col - fromCol) === 1) {
        // En Passant target is the square behind the jumped pawn
        if (enPassantTarget.row === fromRow + direction) {
          moves.push({ row: enPassantTarget.row, col: enPassantTarget.col })
        }
      }
      break
    }

    case "knight": {
      const knightOffsets = [
        [2, 1], [2, -1], [-2, 1], [-2, -1],
        [1, 2], [1, -2], [-1, 2], [-1, -2]
      ]
      for (const [dRow, dCol] of knightOffsets) {
        const toRow = fromRow + dRow
        const toCol = fromCol + dCol
        if (isValidPosition(toRow, toCol)) {
          const targetPiece = board[toRow][toCol]
          if (!targetPiece || targetPiece.color !== color) {
            moves.push({ row: toRow, col: toCol })
          }
        }
      }
      break
    }

    case "bishop": {
      const bishopDirections = [[1, 1], [1, -1], [-1, 1], [-1, -1]]
      for (const [dRow, dCol] of bishopDirections) {
        for (let i = 1; i < 8; i++) {
          if (!addMove(fromRow + i * dRow, fromCol + i * dCol)) break
        }
      }
      break
    }

    case "rook": {
      const rookDirections = [[0, 1], [0, -1], [1, 0], [-1, 0]]
      for (const [dRow, dCol] of rookDirections) {
        for (let i = 1; i < 8; i++) {
          if (!addMove(fromRow + i * dRow, fromCol + i * dCol)) break
        }
      }
      break
    }

    case "queen": {
      const queenDirections = [
        [0, 1], [0, -1], [1, 0], [-1, 0],
        [1, 1], [1, -1], [-1, 1], [-1, -1]
      ]
      for (const [dRow, dCol] of queenDirections) {
        for (let i = 1; i < 8; i++) {
          if (!addMove(fromRow + i * dRow, fromCol + i * dCol)) break
        }
      }
      break
    }

    case "king": {
      const kingDirections = [
        [0, 1], [0, -1], [1, 0], [-1, 0],
        [1, 1], [1, -1], [-1, 1], [-1, -1]
      ]
      for (const [dRow, dCol] of kingDirections) {
        const toRow = fromRow + dRow
        const toCol = fromCol + dCol
        if (isValidPosition(toRow, toCol)) {
          const targetPiece = board[toRow][toCol]
          if (!targetPiece || targetPiece.color !== color) {
            moves.push({ row: toRow, col: toCol })
          }
        }
      }
      break
    }
  }

  return moves
}

/**
 * Checks if a square is currently attacked by any piece of a given attacker color.
 */
export function isSquareAttacked(
  row: number,
  col: number,
  attackerColor: PieceColor,
  board: Board
): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece && piece.color === attackerColor) {
        // Special pawn attack checking (pawns only attack diagonally)
        if (piece.type === "pawn") {
          const direction = attackerColor === "white" ? -1 : 1
          if (row === r + direction && (col === c - 1 || col === c + 1)) {
            return true
          }
          continue
        }

        // Sliders, knights, and kings
        const possibleAttacks = getPseudoLegalMoves(piece, r, c, board)
        if (possibleAttacks.some((move) => move.row === row && move.col === col)) {
          return true
        }
      }
    }
  }
  return false
}
