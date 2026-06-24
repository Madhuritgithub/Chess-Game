import { Board, Position, ChessPiece, PieceColor, CastlingRights } from "../types/chess"
import { getPseudoLegalMoves, isSquareAttacked, isValidPosition } from "./move-generator"

/**
 * Finds the king position for a given color on the board.
 */
export function findKing(color: PieceColor, board: Board): Position | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece && piece.type === "king" && piece.color === color) {
        return { row: r, col: c }
      }
    }
  }
  return null
}

/**
 * Checks if the king of a given color is in check.
 */
export function isKingInCheck(color: PieceColor, board: Board): boolean {
  const kingPos = findKing(color, board)
  if (!kingPos) return false
  const opponentColor = color === "white" ? "black" : "white"
  return isSquareAttacked(kingPos.row, kingPos.col, opponentColor, board)
}

/**
 * Checks if making a move would expose the own king to check.
 */
export function wouldMoveExposeKing(
  from: Position,
  to: Position,
  board: Board,
  color: PieceColor
): boolean {
  // Create a copy of the board
  const tempBoard = board.map((row) => [...row])
  const movingPiece = tempBoard[from.row][from.col]
  if (!movingPiece) return false

  // Make the temporary move (handle en passant capture representation if necessary)
  // If moving piece is a pawn moving diagonally to an empty square, it's an en passant capture
  if (
    movingPiece.type === "pawn" &&
    from.col !== to.col &&
    !tempBoard[to.row][to.col]
  ) {
    // Remove the en passant captured pawn
    const capturedPawnRow = from.row
    const capturedPawnCol = to.col
    tempBoard[capturedPawnRow][capturedPawnCol] = null
  }

  tempBoard[to.row][to.col] = movingPiece
  tempBoard[from.row][from.col] = null

  return isKingInCheck(color, tempBoard)
}

/**
 * Gets all strictly legal moves for a piece (including castling and en passant),
 * filtering out moves that leave the king in check.
 */
export function getLegalMoves(
  piece: ChessPiece,
  fromRow: number,
  fromCol: number,
  board: Board,
  castlingRights: CastlingRights,
  enPassantTarget: Position | null
): Position[] {
  const pseudoMoves = getPseudoLegalMoves(piece, fromRow, fromCol, board, enPassantTarget)

  // Filter out moves that expose the king
  const legalMoves = pseudoMoves.filter(
    (move) => !wouldMoveExposeKing({ row: fromRow, col: fromCol }, move, board, piece.color)
  )

  // If the piece is a King, check for castling moves
  if (piece.type === "king") {
    const opponentColor = piece.color === "white" ? "black" : "white"
    const startRow = piece.color === "white" ? 7 : 0

    // Only allow castling if King is in starting position and has never moved
    if (fromRow === startRow && fromCol === 4 && !piece.hasMoved) {
      // King must not be in check
      if (!isKingInCheck(piece.color, board)) {
        // Kingside castling
        const kingsideRight = castlingRights[piece.color].kingside
        if (kingsideRight) {
          const rookPiece = board[startRow][7]
          // Rook must be present and not moved
          if (rookPiece && rookPiece.type === "rook" && !rookPiece.hasMoved) {
            // Path must be empty
            const pathEmpty = !board[startRow][5] && !board[startRow][6]
            if (pathEmpty) {
              // Intermediate and destination squares must not be under attack
              const pathSafe =
                !isSquareAttacked(startRow, 5, opponentColor, board) &&
                !isSquareAttacked(startRow, 6, opponentColor, board)
              if (pathSafe) {
                legalMoves.push({ row: startRow, col: 6 })
              }
            }
          }
        }

        // Queenside castling
        const queensideRight = castlingRights[piece.color].queenside
        if (queensideRight) {
          const rookPiece = board[startRow][0]
          // Rook must be present and not moved
          if (rookPiece && rookPiece.type === "rook" && !rookPiece.hasMoved) {
            // Path must be empty (squares 1, 2, and 3)
            const pathEmpty =
              !board[startRow][1] &&
              !board[startRow][2] &&
              !board[startRow][3]
            if (pathEmpty) {
              // Intermediate and destination squares (col 3 and 2) must not be under attack
              // Note: col 1 (b1/b8) does not need to be safe from attack for castling, just empty
              const pathSafe =
                !isSquareAttacked(startRow, 3, opponentColor, board) &&
                !isSquareAttacked(startRow, 2, opponentColor, board)
              if (pathSafe) {
                legalMoves.push({ row: startRow, col: 2 })
              }
            }
          }
        }
      }
    }
  }

  return legalMoves
}

/**
 * Checks if the game is in stalemate for a player.
 * Stalemate means the active player has no legal moves and their king is NOT in check.
 */
export function isStalemate(color: PieceColor, board: Board, castlingRights: CastlingRights, enPassantTarget: Position | null): boolean {
  if (isKingInCheck(color, board)) return false

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece && piece.color === color) {
        const moves = getLegalMoves(piece, r, c, board, castlingRights, enPassantTarget)
        if (moves.length > 0) return false
      }
    }
  }

  return true
}

/**
 * Checks if a player is in checkmate.
 * Checkmate means the player's king is in check and they have no legal moves.
 */
export function isCheckmate(color: PieceColor, board: Board, castlingRights: CastlingRights, enPassantTarget: Position | null): boolean {
  if (!isKingInCheck(color, board)) return false

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece && piece.color === color) {
        const moves = getLegalMoves(piece, r, c, board, castlingRights, enPassantTarget)
        if (moves.length > 0) return false
      }
    }
  }

  return true
}

/**
 * Checks if the board has insufficient material for checkmate.
 * Insufficient material conditions:
 * 1. King vs King
 * 2. King + Bishop vs King
 * 3. King + Knight vs King
 * 4. King + Bishop vs King + Bishop (if bishops are on the same color square)
 */
export function isInsufficientMaterial(board: Board): boolean {
  const pieces: { piece: ChessPiece; pos: Position }[] = []

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece) {
        pieces.push({ piece, pos: { row: r, col: c } })
      }
    }
  }

  // 1. King vs King (2 pieces)
  if (pieces.length === 2) {
    return true
  }

  // 3 pieces: King + Bishop vs King OR King + Knight vs King
  if (pieces.length === 3) {
    const nonKing = pieces.find((p) => p.piece.type !== "king")
    if (nonKing) {
      if (nonKing.piece.type === "bishop" || nonKing.piece.type === "knight") {
        return true
      }
    }
  }

  // 4 pieces: King + Bishop vs King + Bishop
  if (pieces.length === 4) {
    const whiteBishop = pieces.find((p) => p.piece.color === "white" && p.piece.type === "bishop")
    const blackBishop = pieces.find((p) => p.piece.color === "black" && p.piece.type === "bishop")

    if (whiteBishop && blackBishop) {
      const whiteBishopSquareColor = (whiteBishop.pos.row + whiteBishop.pos.col) % 2 === 0
      const blackBishopSquareColor = (blackBishop.pos.row + blackBishop.pos.col) % 2 === 0
      // If bishops are on the same square color, it's a draw
      if (whiteBishopSquareColor === blackBishopSquareColor) {
        return true
      }
    }
  }

  return false
}

/**
 * Checks if threefold repetition occurred.
 * Takes the current FEN position identifier and moves history list,
 * counts how many times this position has occurred.
 */
export function isThreefoldRepetition(
  currentFen: string,
  history: { fenAfter: string }[]
): boolean {
  const getRepetitionKey = (fen: string) => {
    // Key consists of: board position, active player, castling rights, en passant target
    return fen.split(" ").slice(0, 4).join(" ")
  }

  const currentKey = getRepetitionKey(currentFen)
  let occurrences = 1 // count the current position

  for (const entry of history) {
    if (getRepetitionKey(entry.fenAfter) === currentKey) {
      occurrences++
    }
  }

  return occurrences >= 3
}
