"use client"

import React, { useMemo } from "react"
import { ChessPiece } from "../../types/chess"

interface CapturedPiecesProps {
  captured: ChessPiece[] // Pieces that have been captured
  playerColor: "white" | "black" // Who captured these pieces (e.g. if playerColor is white, captured contains black pieces)
  advantage: number // Material advantage diff (if > 0, show advantage)
}

const PIECE_VALUES: Record<string, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0
}

const PIECE_ORDER = ["queen", "rook", "bishop", "knight", "pawn"]

export const CapturedPieces: React.FC<CapturedPiecesProps> = React.memo(({
  captured,
  playerColor,
  advantage
}) => {
  // Sort and group captured pieces by value
  const groupedPieces = useMemo(() => {
    const counts: Record<string, number> = {}
    PIECE_ORDER.forEach((type) => {
      counts[type] = 0
    })

    captured.forEach((piece) => {
      counts[piece.type] = (counts[piece.type] || 0) + 1
    })

    return PIECE_ORDER.map((type) => ({
      type,
      count: counts[type]
    })).filter((item) => item.count > 0)
  }, [captured])

  const colorLabel = playerColor === "white" ? "Captured by White" : "Captured by Black"
  const pieceColor = playerColor === "white" ? "black" : "white" // color of the pieces that were captured

  return (
    <div className="flex flex-col gap-1.5 p-2 bg-slate-900/60 text-slate-100 border border-slate-800 rounded-md select-none w-full shadow-md">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
          {colorLabel}
        </span>
        {advantage > 0 && (
          <span className="text-xs font-bold text-green-400 bg-green-950/60 px-1.5 py-0.5 rounded border border-green-900/50">
            +{advantage}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1 items-center min-h-[36px] px-1">
        {groupedPieces.length === 0 ? (
          <span className="text-xs text-slate-500 italic">No pieces captured</span>
        ) : (
          groupedPieces.map(({ type, count }) => (
            <div key={type} className="flex items-center bg-slate-800 px-1.5 py-0.5 rounded-sm border border-slate-700/50">
              <img
                src={`/pieces/${pieceColor}_${type}.svg`}
                alt={`${pieceColor} ${type}`}
                className="w-5 h-5 object-contain"
              />
              {count > 1 && (
                <span className="text-[10px] font-bold text-slate-300 ml-0.5">
                  x{count}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
})

CapturedPieces.displayName = "CapturedPieces"

// Helper to calculate total material value
export function getMaterialValue(pieces: ChessPiece[]): number {
  return pieces.reduce((sum, p) => sum + (PIECE_VALUES[p.type] || 0), 0)
}
