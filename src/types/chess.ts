export type PieceType = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn"
export type PieceColor = "white" | "black"

export interface ChessPiece {
  type: PieceType
  color: PieceColor
  hasMoved?: boolean
}

export type Board = (ChessPiece | null)[][]

export interface Position {
  row: number // 0 to 7
  col: number // 0 to 7
}

export interface CastlingRights {
  white: {
    kingside: boolean
    queenside: boolean
  }
  black: {
    kingside: boolean
    queenside: boolean
  }
}

export interface Move {
  from: Position
  to: Position
  piece: ChessPiece
  captured: ChessPiece | null
  promotion?: PieceType
  isCastling?: "kingside" | "queenside"
  isEnPassant?: boolean
}

export interface MoveHistoryEntry extends Move {
  san: string
  fenBefore: string
  fenAfter: string
  castlingRightsBefore: CastlingRights
  enPassantTargetBefore: Position | null
  halfmoveClockBefore: number
  fullmoveNumberBefore: number
}

export type GameStatus =
  | "playing"
  | "check"
  | "checkmate"
  | "stalemate"
  | "draw-material"
  | "draw-fifty-move"
  | "draw-repetition"
  | "resigned"
  | "draw-agreement"

export interface EvaluationInfo {
  score: number // score in centipawns or moves to mate
  type: "cp" | "mate" // cp = centipawns, mate = moves to checkmate
  bestMove?: string // e.g. "e2e4"
  blunderStatus?: "blunder" | "mistake" | "inaccuracy" | "good" | "best"
}
