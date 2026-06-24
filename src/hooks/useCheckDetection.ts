import { useCallback } from "react"
import { Board, PieceColor, CastlingRights, Position } from "../types/chess"
import {
  isKingInCheck,
  isCheckmate,
  isStalemate,
  isInsufficientMaterial,
  isThreefoldRepetition
} from "../lib/game-rules"

export function useCheckDetection() {
  const detectCheck = useCallback((color: PieceColor, board: Board): boolean => {
    return isKingInCheck(color, board)
  }, [])

  const detectCheckmate = useCallback(
    (color: PieceColor, board: Board, castlingRights: CastlingRights, enPassantTarget: Position | null): boolean => {
      return isCheckmate(color, board, castlingRights, enPassantTarget)
    },
    []
  )

  const detectStalemate = useCallback(
    (color: PieceColor, board: Board, castlingRights: CastlingRights, enPassantTarget: Position | null): boolean => {
      return isStalemate(color, board, castlingRights, enPassantTarget)
    },
    []
  )

  const detectInsufficientMaterial = useCallback((board: Board): boolean => {
    return isInsufficientMaterial(board)
  }, [])

  const detectThreefoldRepetition = useCallback((currentFen: string, history: { fenAfter: string }[]): boolean => {
    return isThreefoldRepetition(currentFen, history)
  }, [])

  return {
    detectCheck,
    detectCheckmate,
    detectStalemate,
    detectInsufficientMaterial,
    detectThreefoldRepetition
  }
}
