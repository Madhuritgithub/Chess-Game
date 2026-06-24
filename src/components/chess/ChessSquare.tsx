"use client"

import React, { useRef, useEffect } from "react"
import { ChessPiece as ChessPieceType, Position } from "../../types/chess"
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
  onClick: () => void
  onDoubleTap: () => void
  onLongPress: () => void
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
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = Date.now()
    
    // Clear any previous long press timeouts
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current)
    }

    // Set a timer for 600ms to detect long press
    touchTimeoutRef.current = setTimeout(() => {
      onLongPress()
      // Reset touchstart to prevent normal tap trigger on touchend
      touchStartRef.current = 0
    }, 600)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current)
      touchTimeoutRef.current = null
    }

    const touchDuration = Date.now() - touchStartRef.current
    if (touchStartRef.current === 0) return // already handled by long press

    const now = Date.now()
    const DOUBLE_TAP_DELAY = 300

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      onDoubleTap()
      lastTapRef.current = 0 // reset
    } else {
      // Single tap candidate
      if (touchDuration < 250) {
        onClick()
      }
      lastTapRef.current = now
    }
  }

  const handleTouchMove = () => {
    // If the user drags their finger, cancel any pending long press
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current)
      touchTimeoutRef.current = null
    }
  }

  // --- Visual Classes and Highlights ---
  const baseBg = isLight ? "bg-[#F0D9B5]" : "bg-[#B58863]"
  
  // Last move overlay
  const lastMoveOverlay = isLastMove ? "after:absolute after:inset-0 after:bg-yellow-400/30" : ""
  
  // Selection overlay
  const selectedOverlay = isSelected ? "after:absolute after:inset-0 after:bg-blue-500/40" : ""
  
  // King in check glow
  const checkOverlay = isKingInCheck
    ? "after:absolute after:inset-0 after:bg-radial after:from-red-600/60 after:to-transparent shadow-[inset_0_0_15px_rgba(220,38,38,0.8)]"
    : ""

  // Accessibility label
  const pieceText = piece ? `${piece.color} ${piece.type}` : "empty"
  const ariaLabel = `${squareName}: ${pieceText}${isValidMove ? ", valid move target" : ""}`

  return (
    <button
      ref={squareRef}
      role="gridcell"
      aria-label={ariaLabel}
      aria-selected={isSelected}
      tabIndex={isFocused ? 0 : -1}
      className={`
        relative w-full aspect-square flex items-center justify-center
        transition-colors duration-150 select-none outline-none focus-visible:ring-4 focus-visible:ring-blue-400 focus-visible:z-10
        ${baseBg}
        ${lastMoveOverlay}
        ${selectedOverlay}
        ${checkOverlay}
        hover:brightness-105 active:brightness-95
      `}
      onClick={(e) => {
        // Only run click if it wasn't handled by touch events to prevent double firing
        if (e.currentTarget.matches(":hover") && !("ontouchstart" in window)) {
          onClick()
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      {/* Render Chess Piece if present */}
      {piece && (
        <ChessPiece
          type={piece.type}
          color={piece.color}
          id={piece.id}
          isSelected={isSelected}
          isInteractive={true}
        />
      )}

      {/* Valid Move Indicator Overlay */}
      {isValidMove && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          {piece ? (
            // Ring indicator for captures
            <div className="w-11/12 h-11/12 md:w-[85%] md:h-[85%] border-[3px] md:border-4 border-green-500/60 rounded-full" />
          ) : (
            // Small dot indicator for empty squares
            <div className="w-3.5 h-3.5 md:w-5 md:h-5 bg-green-500/60 rounded-full" />
          )}
        </div>
      )}

      {/* Inner File/Rank Coordinates labeling (corner squares only) */}
      {col === 0 && (
        <span
          className={`
            absolute top-1 left-1 text-[8px] md:text-[10px] font-bold select-none pointer-events-none z-20
            ${isLight ? "text-[#B58863]" : "text-[#F0D9B5]"}
          `}
        >
          {8 - row}
        </span>
      )}
      {row === 7 && (
        <span
          className={`
            absolute bottom-1 right-1 text-[8px] md:text-[10px] font-bold select-none pointer-events-none z-20
            ${isLight ? "text-[#B58863]" : "text-[#F0D9B5]"}
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
