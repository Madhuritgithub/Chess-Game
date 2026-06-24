"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { PieceColor, GameStatus } from "../../types/chess"
import {
  Undo2,
  Redo2,
  RotateCcw,
  Flag,
  Handshake,
  Copy,
  Download,
  Upload,
  Bot,
  Activity,
  Check,
  Cpu
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface GameControlsProps {
  variant: "sidebar" | "sticky"
  currentPlayer: PieceColor
  gameStatus: GameStatus
  isVsComputer: boolean
  computerColor: PieceColor
  isAnalysisActive: boolean
  isEngineReady: boolean
  bestMoveHint: string | null
  isLive: boolean
  undoMove: () => void
  redoMove: () => void
  resetGame: () => void
  resignGame: (color: PieceColor) => void
  offerDraw: () => void
  exportPgn: () => string
  importPgn: (pgn: string) => void
  setIsVsComputer: (val: boolean) => void
  setComputerColor: (color: PieceColor) => void
  setIsAnalysisActive: (val: boolean) => void
}

export const GameControls: React.FC<GameControlsProps> = React.memo(({
  variant,
  currentPlayer,
  gameStatus,
  isVsComputer,
  computerColor,
  isAnalysisActive,
  isEngineReady,
  bestMoveHint,
  isLive,
  undoMove,
  redoMove,
  resetGame,
  resignGame,
  offerDraw,
  exportPgn,
  importPgn,
  setIsVsComputer,
  setComputerColor,
  setIsAnalysisActive
}) => {
  const { toast } = useToast()
  const [pgnInput, setPgnInput] = useState("")
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const isGameOver = gameStatus !== "playing" && gameStatus !== "check"

  const handleCopyPgn = () => {
    const pgn = exportPgn()
    navigator.clipboard.writeText(pgn)
    setCopied(true)
    toast({
      title: "PGN Copied",
      description: "Game history has been copied to your clipboard."
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportPgnFile = () => {
    const pgn = exportPgn()
    const blob = new Blob([pgn], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `chess_game_${new Date().toISOString().split("T")[0]}.pgn`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast({
      title: "PGN Exported",
      description: "PGN file download started."
    })
  }

  const handleImportSubmit = () => {
    if (!pgnInput.trim()) return
    importPgn(pgnInput)
    setPgnInput("")
    setIsImportOpen(false)
    toast({
      title: "PGN Loaded",
      description: "Game history has been loaded successfully."
    })
  }

  // --- STICKY MOBILE BOTTOM BAR VARIANT ---
  if (variant === "sticky") {
    return (
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border
          flex justify-around items-center px-2 py-2 shadow-2xl md:hidden
          pb-[calc(8px+env(safe-area-inset-bottom,0px))]
        `}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={undoMove}
          title="Undo"
          className="flex flex-col gap-1 items-center justify-center h-12 w-14 text-[9px] hover:bg-slate-100 dark:hover:bg-slate-900"
        >
          <Undo2 className="h-5 w-5" />
          <span>Undo</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={redoMove}
          title="Redo"
          className="flex flex-col gap-1 items-center justify-center h-12 w-14 text-[9px] hover:bg-slate-100 dark:hover:bg-slate-900"
        >
          <Redo2 className="h-5 w-5" />
          <span>Redo</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={resetGame}
          title="Reset Game"
          className="flex flex-col gap-1 items-center justify-center h-12 w-14 text-[9px] hover:bg-slate-100 dark:hover:bg-slate-900"
        >
          <RotateCcw className="h-5 w-5" />
          <span>Reset</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={offerDraw}
          disabled={isGameOver}
          title="Offer Draw"
          className="flex flex-col gap-1 items-center justify-center h-12 w-14 text-[9px] hover:bg-slate-100 dark:hover:bg-slate-900"
        >
          <Handshake className="h-5 w-5" />
          <span>Draw</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => resignGame(currentPlayer)}
          disabled={isGameOver}
          title="Resign"
          className="flex flex-col gap-1 items-center justify-center h-12 w-14 text-[9px] hover:bg-slate-100 dark:hover:bg-slate-900 text-destructive hover:text-destructive"
        >
          <Flag className="h-5 w-5" />
          <span>Resign</span>
        </Button>
      </div>
    )
  }

  // --- SIDEBAR VARIANT (LAPTOP/DESKTOP/TABLET DETAIL CONTROLS) ---
  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-900/60 text-slate-100 border border-slate-800 rounded-lg shadow-lg">
      {/* Game controls header */}
      <h3 className="font-semibold text-sm border-b border-slate-800 pb-2 text-slate-100">Game Controls</h3>

      {/* Main play actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={undoMove} className="flex gap-2 items-center bg-slate-900/40 border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white">
          <Undo2 className="h-4 w-4" />
          Undo
        </Button>
        <Button variant="outline" size="sm" onClick={redoMove} className="flex gap-2 items-center bg-slate-900/40 border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white">
          <Redo2 className="h-4 w-4" />
          Redo
        </Button>
        <Button variant="outline" size="sm" onClick={offerDraw} disabled={isGameOver} className="flex gap-2 items-center bg-slate-900/40 border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white">
          <Handshake className="h-4 w-4" />
          Offer Draw
        </Button>
        <Button variant="destructive" size="sm" onClick={() => resignGame(currentPlayer)} disabled={isGameOver} className="flex gap-2 items-center">
          <Flag className="h-4 w-4" />
          Resign
        </Button>
      </div>

      <Button variant="default" onClick={resetGame} className="w-full flex gap-2 items-center bg-amber-600 hover:bg-amber-500 text-white font-bold">
        <RotateCcw className="h-4 w-4" />
        New Game
      </Button>

      {/* PGN Actions */}
      <div className="flex flex-col gap-2 border-t border-slate-800 pt-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">PGN Utilities</h4>
        <div className="grid grid-cols-3 gap-1.5">
          <Button variant="secondary" size="xs" onClick={handleCopyPgn} className="text-xs flex gap-1 items-center py-1 bg-slate-800 hover:bg-slate-700 text-slate-200">
            {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
            Copy
          </Button>

          <Button variant="secondary" size="xs" onClick={handleExportPgnFile} className="text-xs flex gap-1 items-center py-1 bg-slate-800 hover:bg-slate-700 text-slate-200">
            <Download className="h-3 w-3" />
            Export
          </Button>

          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="xs" className="text-xs flex gap-1 items-center py-1 bg-slate-800 hover:bg-slate-700 text-slate-200">
                <Upload className="h-3 w-3" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
              <DialogHeader>
                <DialogTitle className="text-slate-100">Import Chess PGN</DialogTitle>
              </DialogHeader>
              <div className="p-1">
                <Textarea
                  placeholder="Paste your standard PGN string here (e.g. 1. e4 e5 2. Nf3 Nc6...)"
                  value={pgnInput}
                  onChange={(e) => setPgnInput(e.target.value)}
                  className="min-h-[140px] font-mono text-xs bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-500"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportOpen(false)} className="border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white">Cancel</Button>
                <Button onClick={handleImportSubmit} disabled={!pgnInput.trim()} className="bg-amber-600 hover:bg-amber-500 text-white font-semibold">Load Game</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stockfish Engine Controls */}
      <div className="flex flex-col gap-2 border-t border-slate-800 pt-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5 text-blue-400" />
          Stockfish Engine
        </h4>

        <div className="flex flex-col gap-2.5">
          {/* Vs Computer Settings */}
          <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded border border-slate-800">
            <span className="text-xs font-medium text-slate-300">Play vs Computer</span>
            <Button
              size="xs"
              variant={isVsComputer ? "default" : "outline"}
              onClick={() => {
                setIsVsComputer(!isVsComputer)
                setIsAnalysisActive(false) // turn off analysis
              }}
              className={`flex gap-1 items-center ${isVsComputer ? "bg-blue-600 hover:bg-blue-500 text-white" : "border-slate-800 text-slate-400 hover:bg-slate-800"}`}
            >
              <Bot className="h-3.5 w-3.5" />
              {isVsComputer ? "Active" : "Off"}
            </Button>
          </div>

          {isVsComputer && (
            <div className="flex justify-between items-center text-xs px-1 text-slate-300">
              <span>Computer Plays:</span>
              <div className="flex gap-1">
                <Button
                  size="xs"
                  variant={computerColor === "black" ? "default" : "outline"}
                  onClick={() => setComputerColor("black")}
                  className={computerColor === "black" ? "bg-slate-800 text-white" : "border-slate-800 text-slate-400 hover:bg-slate-800"}
                >
                  Black
                </Button>
                <Button
                  size="xs"
                  variant={computerColor === "white" ? "default" : "outline"}
                  onClick={() => setComputerColor("white")}
                  className={computerColor === "white" ? "bg-slate-800 text-white" : "border-slate-800 text-slate-400 hover:bg-slate-800"}
                >
                  White
                </Button>
              </div>
            </div>
          )}

          {/* Analysis Settings */}
          <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded border border-slate-800">
            <span className="text-xs font-medium text-slate-300">Live Evaluation Bar</span>
            <Button
              size="xs"
              variant={isAnalysisActive ? "default" : "outline"}
              onClick={() => {
                setIsAnalysisActive(!isAnalysisActive)
                setIsVsComputer(false) // turn off computer opponent
              }}
              className={`flex gap-1 items-center ${isAnalysisActive ? "bg-blue-600 hover:bg-blue-500 text-white" : "border-slate-800 text-slate-400 hover:bg-slate-800"}`}
            >
              <Activity className="h-3.5 w-3.5" />
              {isAnalysisActive ? "Active" : "Off"}
            </Button>
          </div>

          {/* Engine Status info */}
          {(isAnalysisActive || isVsComputer) && (
            <div className="text-[10px] text-slate-400 font-mono flex flex-col gap-1 border-t border-slate-800/60 pt-2 px-1">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={isEngineReady ? "text-green-400 font-semibold" : "text-amber-500 animate-pulse"}>
                  {isEngineReady ? "Ready" : "Initializing..."}
                </span>
              </div>
              {bestMoveHint && (
                <div className="flex justify-between">
                  <span>Engine Hint:</span>
                  <span className="text-blue-400 font-bold bg-blue-950/40 px-1 rounded border border-blue-900/40">
                    {bestMoveHint}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

GameControls.displayName = "GameControls"
