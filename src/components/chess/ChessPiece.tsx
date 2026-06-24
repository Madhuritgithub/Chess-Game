"use client"

import React from "react"
import { motion } from "framer-motion"
import { PieceType, PieceColor } from "../../types/chess"

interface ChessPieceProps {
  type: PieceType
  color: PieceColor
  id?: string
  isSelected?: boolean
  isInteractive?: boolean
}

export const ChessPiece: React.FC<ChessPieceProps> = React.memo(({
  type,
  color,
  id,
  isSelected = false,
  isInteractive = true
}) => {
  const assetPath = `/pieces/${color}_${type}.svg`
  const pieceLabel = `${color} ${type}`

  // Unique layout ID for Framer Motion to animate transitions
  const motionId = id || `${color}-${type}`

  return (
    <motion.img
      src={assetPath}
      alt={pieceLabel}
      title={pieceLabel}
      layoutId={motionId}
      layout
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 30
      }}
      className={`
        w-4/5 h-4/5 select-none object-contain pointer-events-none
        ${isInteractive ? "cursor-pointer" : "cursor-default"}
        ${isSelected ? "drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] scale-110" : ""}
      `}
      aria-hidden="true"
    />
  )
})

ChessPiece.displayName = "ChessPiece"
