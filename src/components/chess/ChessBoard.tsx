"use client"

import React, { useState, useCallback, useMemo } from "react"
import { Board, Position, MoveHistoryEntry, PieceColor, BoardTheme } from "../../types/chess"
import { ChessSquare } from "./ChessSquare"
import { findKing, isKingInCheck } from "../../lib/game-rules"
import { useToast } from "@/hooks/use-toast"
import { posToSquare } from "../../lib/notation"

interface ChessBoardProps {
  board: Board
  currentPlayer: PieceColor
  selectedSquare: Position | null
  validMoves: Position[]
  moveHistory: MoveHistoryEntry[]
  historyIndex: number
  promotionPending: any
  handleSquareClick: (row: number, col: number) => void
  handleDoubleTap: (row: number, col: number) => void
  isVsComputer: boolean
  computerColor: PieceColor
  theme: BoardTheme
  isBoardFlipped: boolean
}

export const ChessBoard: React.FC<ChessBoardProps> = React.memo(({
  board,
  currentPlayer,
  selectedSquare,
  validMoves,
  moveHistory,
  historyIndex,
  promotionPending,
  handleSquareClick,
  handleDoubleTap,
  isVsComputer,
  computerColor,
  theme,
  isBoardFlipped
}) => {
  const { toast } = useToast()
  
  // Keyboard focus position tracking
  const [focusedSquare, setFocusedSquare] = useState<Position>({ row: 7, col: 0 })

  // --- Compute Highlights ---
  const lastMove = useMemo(() => {
    if (moveHistory.length === 0) return null
    const index = historyIndex === -1 ? moveHistory.length - 1 : historyIndex
    if (index < 0 || index >= moveHistory.length) return null
    return moveHistory[index]
  }, [moveHistory, historyIndex])

  const isLastMoveSquare = useCallback((row: number, col: number) => {
    if (!lastMove) return false
    const matchFrom = lastMove.from.row === row && lastMove.from.col === col
    const matchTo = lastMove.to.row === row && lastMove.to.col === col
    return matchFrom || matchTo
  }, [lastMove])

  const kingInCheckPos = useMemo(() => {
    const activePlayerCheck = isKingInCheck(currentPlayer, board)
    if (!activePlayerCheck) return null
    return findKing(currentPlayer, board)
  }, [currentPlayer, board])

  const isKingCheckedSquare = useCallback((row: number, col: number) => {
    if (!kingInCheckPos) return false
    return kingInCheckPos.row === row && kingInCheckPos.col === col
  }, [kingInCheckPos])

  // --- Touch Gesture: Long Press for Move Preview ---
  const handleLongPress = useCallback((row: number, col: number) => {
    const piece = board[row][col]
    if (!piece) return

    handleSquareClick(row, col)

    const square = posToSquare({ row, col })
    toast({
      title: `Move Preview: ${piece.color} ${piece.type} on ${square}`,
      description: `Select a highlighted square to execute the move. Tap elsewhere to cancel.`
    })
  }, [board, handleSquareClick, toast])

  // --- Keyboard Grid Navigation ---
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const { row, col } = focusedSquare
    let nextRow = row
    let nextCol = col

    // Adjust arrow directions based on board flipping
    const upDir = isBoardFlipped ? 1 : -1
    const downDir = isBoardFlipped ? -1 : 1
    const leftDir = isBoardFlipped ? 1 : -1
    const rightDir = isBoardFlipped ? -1 : 1

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault()
        if (isBoardFlipped ? row < 7 : row > 0) nextRow = row + upDir
        break
      case "ArrowDown":
        e.preventDefault()
        if (isBoardFlipped ? row > 0 : row < 7) nextRow = row + downDir
        break
      case "ArrowLeft":
        e.preventDefault()
        if (isBoardFlipped ? col < 7 : col > 0) nextCol = col + leftDir
        break
      case "ArrowRight":
        e.preventDefault()
        if (isBoardFlipped ? col > 0 : col < 7) nextCol = col + rightDir
        break
      case "Enter":
      case " ":
        e.preventDefault()
        handleSquareClick(row, col)
        break
      case "Escape":
        e.preventDefault()
        if (selectedSquare) {
          handleSquareClick(selectedSquare.row, selectedSquare.col)
        }
        break
      default:
        return
    }

    setFocusedSquare({ row: nextRow, col: nextCol })
  }

  // --- Reverse loops for Flipped Rendering ---
  const gridSquares = useMemo(() => {
    const rows = Array.from({ length: 8 }, (_, i) => i)
    const cols = Array.from({ length: 8 }, (_, i) => i)

    if (isBoardFlipped) {
      rows.reverse()
      cols.reverse()
    }

    const items: React.ReactNode[] = []

    rows.forEach((rowIndex) => {
      cols.forEach((colIndex) => {
        const piece = board[rowIndex][colIndex]
        const isSelected = selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex
        const isValidMove = validMoves.some((m) => m.row === rowIndex && m.col === colIndex)
        const isLast = isLastMoveSquare(rowIndex, colIndex)
        const isChecked = isKingCheckedSquare(rowIndex, colIndex)
        const isFocused = focusedSquare.row === rowIndex && focusedSquare.col === colIndex

        items.push(
          <ChessSquare
            key={`${rowIndex}-${colIndex}`}
            row={rowIndex}
            col={colIndex}
            piece={piece}
            isSelected={isSelected}
            isValidMove={isValidMove}
            isLastMove={isLast}
            isKingInCheck={isChecked}
            isFocused={isFocused}
            theme={theme}
            isFlipped={isBoardFlipped}
            onClick={() => handleSquareClick(rowIndex, colIndex)}
            onDoubleTap={() => handleDoubleTap(rowIndex, colIndex)}
            onLongPress={() => handleLongPress(rowIndex, colIndex)}
          />
        )
      })
    })

    return items
  }, [
    board,
    selectedSquare,
    validMoves,
    focusedSquare,
    theme,
    isBoardFlipped,
    isLastMoveSquare,
    isKingCheckedSquare,
    handleSquareClick,
    handleDoubleTap,
    handleLongPress
  ])

  return (
    <div
      role="grid"
      aria-label="Chess board"
      aria-colcount={8}
      aria-rowcount={8}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`
        relative w-full aspect-square
        grid grid-cols-8 grid-rows-8 border-4 border-slate-800 rounded-xl shadow-2xl overflow-hidden
        focus:outline-none focus:ring-4 focus:ring-amber-500/50 transition-all duration-300
        bg-slate-900
        ${isVsComputer && currentPlayer === computerColor ? "pointer-events-none opacity-95" : ""}
      `}
    >
      {gridSquares}
    </div>
  )
})

ChessBoard.displayName = "ChessBoard"
