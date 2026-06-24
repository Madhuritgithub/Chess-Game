"use client"

import React, { useRef, useEffect } from "react"
import { ChessPiece as ChessPieceType, Position, BoardTheme } from "../../types/chess"
import { ChessPiece } from "./ChessPiece"
import { posToSquare } from "../../lib/notation"

interface ChessSquareProps {
  row: number
  col: number
  piece: ChessPieceType | null
  isSelected: boolean
  isValidMove: boolean
  isLastMove: boolean
  isKingInCheck: boolean
  isFocused: boolean
  theme: BoardTheme
  isFlipped: boolean
  onClick: () => void
  onDoubleTap: () => void
  onLongPress: () => void
}

// Color palettes for our premium board skins
export const THEME_COLORS: Record<BoardTheme, {
  light: string
  dark: string
  labelLight: string
  labelDark: string
}> = {
  "classic-wood": {
    light: "bg-[#eed6b1]",
    dark: "bg-[#8a5a36]",
    labelLight: "text-[#8a5a36]",
    labelDark: "text-[#eed6b1]"
  },
  "emerald": {
    light: "bg-[#ececd7]",
    dark: "bg-[#739552]",
    labelLight: "text-[#739552]",
    labelDark: "text-[#ececd7]"
  },
  "ocean": {
    light: "bg-[#e9edf6]",
    dark: "bg-[#4b7399]",
    labelLight: "text-[#4b7399]",
    labelDark: "text-[#e9edf6]"
  },
  "midnight": {
    light: "bg-[#e2e8f0]",
    dark: "bg-[#334155]",
    labelLight: "text-[#334155]",
    labelDark: "text-[#e2e8f0]"
  },
  "cyberpunk": {
    light: "bg-[#2b224d]",
    dark: "bg-[#110924]",
    labelLight: "text-cyan-400",
    labelDark: "text-pink-500"
  }
}

export const ChessSquare: React.FC<ChessSquareProps> = React.memo(({
  row,
  col,
  piece,
  isSelected,
  isValidMove,
  isLastMove,
  isKingInCheck,
  isFocused,
  theme,
  isFlipped,
  onClick,
  onDoubleTap,
  onLongPress
}) => {
  const squareName = posToSquare({ row, col })
  const isLight = (row + col) % 2 === 0
  const squareRef = useRef<HTMLButtonElement>(null)

  // Touch gesture state variables
  const touchStartRef = useRef<number>(0)
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTapRef = useRef<number>(0)

  // Focus effect for keyboard navigation
  useEffect(() => {
    if (isFocused && squareRef.current) {
      squareRef.current.focus()
    }
  }, [isFocused])

  // --- Gesture Event Handlers ---
  const handleTouchStart = () => {
    touchStartRef.current = Date.now()
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current)
    }

    touchTimeoutRef.current = setTimeout(() => {
      onLongPress()
      touchStartRef.current = 0
    }, 600)
  }

  const handleTouchEnd = () => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current)
      touchTimeoutRef.current = null
    }

    const touchDuration = Date.now() - touchStartRef.current
    if (touchStartRef.current === 0) return

    const now = Date.now()
    const DOUBLE_TAP_DELAY = 300

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      onDoubleTap()
      lastTapRef.current = 0
    } else {
      if (touchDuration < 250) {
        onClick()
      }
      lastTapRef.current = now
    }
  }

  const handleTouchMove = () => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current)
      touchTimeoutRef.current = null
    }
  }

  // Pick theme styling
  const palette = THEME_COLORS[theme] || THEME_COLORS["emerald"]
  const baseBg = isLight ? palette.light : palette.dark
  const labelColor = isLight ? palette.labelLight : palette.labelDark

  // Selection Glow & Borders
  const selectedOverlay = isSelected
    ? "after:absolute after:inset-0 after:bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.6)] z-10 ring-2 ring-amber-500/50"
    : ""

  // Last move overlay
  const lastMoveOverlay = isLastMove
    ? "after:absolute after:inset-0 after:bg-yellow-400/25 border-yellow-400/40 border-2"
    : ""

  // Check alert pulse
  const checkOverlay = isKingInCheck
    ? "after:absolute after:inset-0 after:bg-radial after:from-red-600/70 after:to-transparent shadow-[inset_0_0_18px_rgba(220,38,38,0.9)] animate-pulse z-10 border-red-500/50 border-2"
    : ""

  const ariaLabel = `${squareName}: ${piece ? `${piece.color} ${piece.type}` : "empty"}${isValidMove ? ", valid move target" : ""}`

  return (
    <button
      ref={squareRef}
      role="gridcell"
      aria-label={ariaLabel}
      aria-selected={isSelected}
      tabIndex={isFocused ? 0 : -1}
      className={`
        relative w-full aspect-square flex items-center justify-center
        transition-all duration-150 select-none outline-none focus-visible:ring-4 focus-visible:ring-blue-400 focus-visible:z-10
        ${baseBg}
        ${selectedOverlay}
        ${lastMoveOverlay}
        ${checkOverlay}
        hover:brightness-[1.08] hover:contrast-[1.02] active:scale-95
      `}
      onClick={(e) => {
        if (e.currentTarget.matches(":hover") && !("ontouchstart" in window)) {
          onClick()
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      {/* Chess Piece with Framer Motion spring layouts */}
      {piece && (
        <ChessPiece
          type={piece.type}
          color={piece.color}
          id={piece.id}
          isSelected={isSelected}
          isInteractive={true}
        />
      )}

      {/* Valid Move Indicator Overlays */}
      {isValidMove && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          {piece ? (
            // Ring indicator for captures
            <div className="w-11/12 h-11/12 md:w-[85%] md:h-[85%] border-[3.5px] md:border-4 border-green-500/80 rounded-full animate-pulse" />
          ) : (
            // Small dot indicator for empty squares
            <div className="w-3.5 h-3.5 md:w-5 md:h-5 bg-green-500/80 rounded-full shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
          )}
        </div>
      )}

      {/* Coordinates labels on borders */}
      {((!isFlipped && col === 0) || (isFlipped && col === 7)) && (
        <span
          className={`
            absolute top-1 left-1 text-[8px] md:text-[10px] font-extrabold select-none pointer-events-none z-20 opacity-80
            ${labelColor}
          `}
        >
          {8 - row}
        </span>
      )}
      {((!isFlipped && row === 7) || (isFlipped && row === 0)) && (
        <span
          className={`
            absolute bottom-1 right-1 text-[8px] md:text-[10px] font-extrabold select-none pointer-events-none z-20 opacity-80
            ${labelColor}
          `}
        >
          {FILES[col]}
        </span>
      )}
    </button>
  )
})

ChessSquare.displayName = "ChessSquare"

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
