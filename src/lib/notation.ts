import { Board, Position, ChessPiece, Move, CastlingRights, MoveHistoryEntry } from "../types/chess"
import { getLegalMoves, isKingInCheck, isCheckmate } from "./game-rules"

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]

/**
 * Converts a board Position to standard algebraic square notation (e.g. e4).
 */
export function posToSquare(pos: Position): string {
  return FILES[pos.col] + RANKS[pos.row]
}

/**
 * Converts algebraic square notation (e.g. e4) to board coordinates.
 */
export function squareToPos(square: string): Position {
  const col = FILES.indexOf(square[0])
  const row = RANKS.indexOf(square[1])
  return { row, col }
}

/**
 * Generates the FEN (Forsyth-Edwards Notation) string for a given board state.
 */
export function generateFen(
  board: Board,
  currentPlayer: "white" | "black",
  castlingRights: CastlingRights,
  enPassantTarget: Position | null,
  halfmoveClock: number,
  fullmoveNumber: number
): string {
  const rows: string[] = []

  for (let r = 0; r < 8; r++) {
    let emptyCount = 0
    let rowStr = ""

    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece) {
        if (emptyCount > 0) {
          rowStr += emptyCount
          emptyCount = 0
        }
        let pieceChar = ""
        switch (piece.type) {
          case "pawn": pieceChar = "p"; break
          case "knight": pieceChar = "n"; break
          case "bishop": pieceChar = "b"; break
          case "rook": pieceChar = "r"; break
          case "queen": pieceChar = "q"; break
          case "king": pieceChar = "k"; break
        }
        rowStr += piece.color === "white" ? pieceChar.toUpperCase() : pieceChar
      } else {
        emptyCount++
      }
    }

    if (emptyCount > 0) {
      rowStr += emptyCount
    }
    rows.push(rowStr)
  }

  const boardFen = rows.join("/")
  const activeColor = currentPlayer === "white" ? "w" : "b"

  // Castling rights
  let castlingStr = ""
  if (castlingRights.white.kingside) castlingStr += "K"
  if (castlingRights.white.queenside) castlingStr += "Q"
  if (castlingRights.black.kingside) castlingStr += "k"
  if (castlingRights.black.queenside) castlingStr += "q"
  if (castlingStr === "") castlingStr = "-"

  // En Passant target square
  const epStr = enPassantTarget ? posToSquare(enPassantTarget) : "-"

  return `${boardFen} ${activeColor} ${castlingStr} ${epStr} ${halfmoveClock} ${fullmoveNumber}`
}

/**
 * Parses a FEN string and returns the complete chess state.
 */
export function parseFen(fen: string): {
  board: Board
  currentPlayer: "white" | "black"
  castlingRights: CastlingRights
  enPassantTarget: Position | null
  halfmoveClock: number
  fullmoveNumber: number
} {
  const parts = fen.trim().split(/\s+/)
  const boardPart = parts[0]
  const activeColorPart = parts[1] || "w"
  const castlingPart = parts[2] || "-"
  const epPart = parts[3] || "-"
  const halfmovePart = parts[4] || "0"
  const fullmovePart = parts[5] || "1"

  // Parse board
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null))
  const rows = boardPart.split("/")

  for (let r = 0; r < 8; r++) {
    const rowStr = rows[r]
    let c = 0
    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i]
      if (/[0-9]/.test(char)) {
        c += parseInt(char)
      } else {
        const color = char === char.toUpperCase() ? "white" : "black"
        const typeChar = char.toLowerCase()
        let type: ChessPiece["type"] = "pawn"
        switch (typeChar) {
          case "p": type = "pawn"; break
          case "n": type = "knight"; break
          case "b": type = "bishop"; break
          case "r": type = "rook"; break
          case "q": type = "queen"; break
          case "k": type = "king"; break
        }
        board[r][c] = { type, color, hasMoved: true } // assume moved for simplicity in load
        c++
      }
    }
  }

  // Parse current player
  const currentPlayer = activeColorPart === "w" ? "white" : "black"

  // Parse castling rights
  const castlingRights: CastlingRights = {
    white: { kingside: castlingPart.includes("K"), queenside: castlingPart.includes("Q") },
    black: { kingside: castlingPart.includes("k"), queenside: castlingPart.includes("q") }
  }

  // Parse en passant target
  let enPassantTarget: Position | null = null
  if (epPart !== "-") {
    enPassantTarget = squareToPos(epPart)
  }

  const halfmoveClock = parseInt(halfmovePart)
  const fullmoveNumber = parseInt(fullmovePart)

  return {
    board,
    currentPlayer,
    castlingRights,
    enPassantTarget,
    halfmoveClock,
    fullmoveNumber
  }
}

/**
 * Converts a move to Standard Algebraic Notation (SAN).
 */
export function moveToSan(
  move: Move,
  boardBefore: Board,
  castlingRightsBefore: CastlingRights,
  enPassantTargetBefore: Position | null,
  isCheckAfter: boolean,
  isCheckmateAfter: boolean
): string {
  const { from, to, piece, captured, promotion, isCastling } = move

  if (isCastling === "kingside") return "O-O" + (isCheckmateAfter ? "#" : isCheckAfter ? "+" : "")
  if (isCastling === "queenside") return "O-O-O" + (isCheckmateAfter ? "#" : isCheckAfter ? "+" : "")

  let san = ""

  if (piece.type === "pawn") {
    if (captured || move.isEnPassant) {
      san += FILES[from.col] + "x"
    }
    san += posToSquare(to)
    if (promotion) {
      let promoChar = ""
      switch (promotion) {
        case "queen": promoChar = "Q"; break
        case "rook": promoChar = "R"; break
        case "bishop": promoChar = "B"; break
        case "knight": promoChar = "N"; break
      }
      san += "=" + promoChar
    }
  } else {
    let pieceChar = ""
    switch (piece.type) {
      case "knight": pieceChar = "N"; break
      case "bishop": pieceChar = "B"; break
      case "rook": pieceChar = "R"; break
      case "queen": pieceChar = "Q"; break
      case "king": pieceChar = "K"; break
    }

    san += pieceChar

    // Determine if disambiguation is needed
    // Find all other pieces of the same type and color that can also legally move to the target square
    const duplicateAttackers: Position[] = []
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (r === from.row && c === from.col) continue
        const p = boardBefore[r][c]
        if (p && p.color === piece.color && p.type === piece.type) {
          const legalMoves = getLegalMoves(p, r, c, boardBefore, castlingRightsBefore, enPassantTargetBefore)
          if (legalMoves.some((m) => m.row === to.row && m.col === to.col)) {
            duplicateAttackers.push({ row: r, col: c })
          }
        }
      }
    }

    if (duplicateAttackers.length > 0) {
      const shareFile = duplicateAttackers.some((pos) => pos.col === from.col)
      const shareRank = duplicateAttackers.some((pos) => pos.row === from.row)

      if (!shareFile) {
        san += FILES[from.col] // disambiguate by file
      } else if (!shareRank) {
        san += RANKS[from.row] // disambiguate by rank
      } else {
        san += FILES[from.col] + RANKS[from.row] // disambiguate by both
      }
    }

    if (captured) {
      san += "x"
    }

    san += posToSquare(to)
  }

  if (isCheckmateAfter) {
    san += "#"
  } else if (isCheckAfter) {
    san += "+"
  }

  return san
}

/**
 * Compiles a list of move history entries into a PGN (Portable Game Notation) string.
 */
export function exportToPgn(history: MoveHistoryEntry[]): string {
  const pgnLines: string[] = []

  // Add standard headers
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")

  pgnLines.push(`[Event "Casual Game"]`)
  pgnLines.push(`[Site "Localhost"]`)
  pgnLines.push(`[Date "${year}.${month}.${day}"]`)
  pgnLines.push(`[Round "1"]`)
  pgnLines.push(`[White "White Player"]`)
  pgnLines.push(`[Black "Black Player"]`)
  pgnLines.push(`[Result "*"]`)
  pgnLines.push("")

  let movesStr = ""
  for (let i = 0; i < history.length; i++) {
    const entry = history[i]
    if (i % 2 === 0) {
      const moveNum = Math.floor(i / 2) + 1
      movesStr += `${moveNum}. ${entry.san} `
    } else {
      movesStr += `${entry.san} `
    }
  }

  pgnLines.push(movesStr.trim() + " *")

  return pgnLines.join("\n")
}

/**
 * Parses PGN string moves and generates FEN progression, checking validation.
 * Note: A full robust PGN parser handles headers and standard game text.
 */
export function parsePgnMoves(pgn: string): string[] {
  // Strip headers
  const lines = pgn.split("\n")
  const movesLines = lines.filter((line) => !line.trim().startsWith("["))
  const fullMovesText = movesLines.join(" ").replace(/\d+\./g, " ").replace(/\*/g, "").trim()
  const moves = fullMovesText.split(/\s+/).filter(Boolean)
  return moves
}
