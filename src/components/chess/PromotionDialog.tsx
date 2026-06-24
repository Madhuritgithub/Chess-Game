"use client"

import React from "react"
import Image from "next/image"
import { PieceType, PieceColor, Position } from "../../types/chess"

interface PromotionDialogProps {
  pending: { from: Position; to: Position } | null
  color: PieceColor
  onSelect: (pieceType: PieceType) => void
  onCancel: () => void
}

const PROMO_OPTIONS: PieceType[] = ["queen", "rook", "bishop", "knight"]

export const PromotionDialog: React.FC<PromotionDialogProps> = React.memo(({
  pending,
  color,
  onSelect,
  onCancel
}) => {
  if (!pending) return null

  return (
    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg select-none">
      <div className="bg-background border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xl flex flex-col items-center max-w-[280px] w-full gap-3">
        <h3 className="font-semibold text-sm text-foreground text-center">
          Pawn Promotion
        </h3>
        <p className="text-[10px] text-muted-foreground text-center">
          Choose a piece to promote your pawn.
        </p>

        <div className="grid grid-cols-2 gap-2 w-full mt-1">
          {PROMO_OPTIONS.map((type) => {
            const pieceLabel = `${color} ${type}`
            return (
              <button
                key={type}
                onClick={() => onSelect(type)}
                className={`
                  flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-800
                  hover:bg-slate-100 dark:hover:bg-slate-900 active:scale-95 transition-all
                  bg-card shadow-sm
                `}
                title={pieceLabel}
              >
                <Image
                  src={`/pieces/${color}_${type}.svg`}
                  alt={pieceLabel}
                  width={48}
                  height={48}
                  className="object-contain"
                />
                <span className="text-[10px] font-bold capitalize mt-1 text-slate-500">
                  {type}
                </span>
              </button>
            )
          })}
        </div>

        <button
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-foreground font-semibold mt-2 underline"
        >
          Cancel Promotion
        </button>
      </div>
    </div>
  )
})

PromotionDialog.displayName = "PromotionDialog"
