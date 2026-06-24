import { useCallback } from "react"
import { Board, ChessPiece, CastlingRights, Position } from "../types/chess"
import { getLegalMoves, wouldMoveExposeKing } from "../lib/game-rules"

export function useMoveGeneration() {
  const generateLegalMoves = useCallback(
    (
      piece: ChessPiece,
      fromRow: number,
      fromCol: number,
      board: Board,
      castlingRights: CastlingRights,
      enPassantTarget: Position | null
    ): Position[] => {
      return getLegalMoves(piece, fromRow, fromCol, board, castlingRights, enPassantTarget)
    },
    []
  )

  const checkMoveExposesKing = useCallback(
    (from: Position, to: Position, board: Board, color: ChessPiece["color"]): boolean => {
      return wouldMoveExposeKing(from, to, board, color)
    },
    []
  )

  return {
    generateLegalMoves,
    checkMoveExposesKing
  }
}
