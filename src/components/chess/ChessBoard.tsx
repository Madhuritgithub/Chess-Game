"use client"

import React, { useState, useCallback, useMemo } from "react"
import { Board, Position, MoveHistoryEntry, PieceColor } from "../../types/chess"
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
  computerColor
}) => {
  const { toast } = useToast()
  
  // Keyboard focus position tracking
  const [focusedSquare, setFocusedSquare] = useState<Position>({ row: 7, col: 0 })

  // --- Compute Highlights ---
  // Last move start and end squares
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

  // King in check square
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

    // Show standard move options
    handleSquareClick(row, col)

    // Trigger toast listing destinations
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

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault()
        if (row > 0) nextRow = row - 1
        break
      case "ArrowDown":
        e.preventDefault()
        if (row < 7) nextRow = row + 1
        break
      case "ArrowLeft":
        e.preventDefault()
        if (col > 0) nextCol = col - 1
        break
      case "ArrowRight":
        e.preventDefault()
        if (col < 7) nextCol = col + 1
        break
      case "Enter":
      case " ":
        e.preventDefault()
        handleSquareClick(row, col)
        break
      case "Escape":
        e.preventDefault()
        if (selectedSquare) {
          handleSquareClick(selectedSquare.row, selectedSquare.col) // toggles selection off
        }
        break
      default:
        return
    }

    setFocusedSquare({ row: nextRow, col: nextCol })
  }

  return (
    <div
      role="grid"
      aria-label="Chess board"
      aria-colcount={8}
      aria-rowcount={8}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`
        relative w-full max-w-[100vw] sm:max-w-[600px] lg:max-w-[700px] aspect-square
        grid grid-cols-8 grid-rows-8 border-4 border-slate-800 rounded-lg shadow-2xl overflow-hidden
        focus:outline-none focus:ring-4 focus:ring-blue-500/80
        ${isVsComputer && currentPlayer === computerColor ? "pointer-events-none opacity-90" : ""}
      `}
    >
      {board.map((boardRow, rowIndex) =>
        boardRow.map((piece, colIndex) => {
          const isSelected = selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex
          const isValidMove = validMoves.some((m) => m.row === rowIndex && m.col === colIndex)
          const isLast = isLastMoveSquare(rowIndex, colIndex)
          const isChecked = isKingCheckedSquare(rowIndex, colIndex)
          const isFocused = focusedSquare.row === rowIndex && focusedSquare.col === colIndex

          return (
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
              onClick={() => handleSquareClick(rowIndex, colIndex)}
              onDoubleTap={() => handleDoubleTap(rowIndex, colIndex)}
              onLongPress={() => handleLongPress(rowIndex, colIndex)}
            />
          )
        })
      )}
    </div>
  )
})

ChessBoard.displayName = "ChessBoard"
