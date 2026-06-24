"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { PieceColor, GameStatus, GameMode, TimeControl, BoardTheme } from "../../types/chess"
import { DEFAULT_TIME_CONTROLS } from "../../hooks/useChessGame"
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
  Cpu,
  RefreshCw,
  Clock,
  Sparkles,
  Users,
  Settings2
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

  // New premium fields
  gameMode: GameMode
  setGameMode: (mode: GameMode) => void
  boardTheme: BoardTheme
  setBoardTheme: (theme: BoardTheme) => void
  isBoardFlipped: boolean
  setIsBoardFlipped: (flipped: boolean) => void
  aiLevel: number
  setAiLevel: (level: number) => void
  timeControl: TimeControl
  setTimeControl: (tc: TimeControl) => void
}

export const GameControls: React.FC<GameControlsProps> = React.memo(({
  variant,
  currentPlayer,
  gameStatus,
  computerColor,
  isAnalysisActive,
  isEngineReady,
  bestMoveHint,
  undoMove,
  redoMove,
  resetGame,
  resignGame,
  offerDraw,
  exportPgn,
  importPgn,
  setComputerColor,
  setIsAnalysisActive,

  gameMode,
  setGameMode,
  boardTheme,
  setBoardTheme,
  isBoardFlipped,
  setIsBoardFlipped,
  aiLevel,
  setAiLevel,
  timeControl,
  setTimeControl
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
          fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-t border-slate-900
          flex justify-around items-center px-1.5 py-1.5 shadow-2xl md:hidden
          pb-[calc(6px+env(safe-area-inset-bottom,0px))]
        `}
      >
        <Button
          variant="ghost"
          size="xs"
          onClick={undoMove}
          title="Undo"
          className="flex flex-col gap-1 items-center justify-center h-11 w-12 text-[8px] font-bold text-slate-400 hover:text-white"
        >
          <Undo2 className="h-4 w-4" />
          <span>Undo</span>
        </Button>

        <Button
          variant="ghost"
          size="xs"
          onClick={redoMove}
          title="Redo"
          className="flex flex-col gap-1 items-center justify-center h-11 w-12 text-[8px] font-bold text-slate-400 hover:text-white"
        >
          <Redo2 className="h-4 w-4" />
          <span>Redo</span>
        </Button>

        <Button
          variant="ghost"
          size="xs"
          onClick={() => setIsBoardFlipped(!isBoardFlipped)}
          title="Flip Board"
          className="flex flex-col gap-1 items-center justify-center h-11 w-12 text-[8px] font-bold text-slate-400 hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Flip</span>
        </Button>

        <Button
          variant="ghost"
          size="xs"
          onClick={offerDraw}
          disabled={isGameOver}
          title="Offer Draw"
          className="flex flex-col gap-1 items-center justify-center h-11 w-12 text-[8px] font-bold text-slate-400 hover:text-white disabled:opacity-30"
        >
          <Handshake className="h-4 w-4" />
          <span>Draw</span>
        </Button>

        <Button
          variant="ghost"
          size="xs"
          onClick={() => resignGame(currentPlayer)}
          disabled={isGameOver}
          title="Resign"
          className="flex flex-col gap-1 items-center justify-center h-11 w-12 text-[8px] font-bold text-red-500 hover:text-red-400 hover:bg-red-950/20 disabled:opacity-30"
        >
          <Flag className="h-4 w-4" />
          <span>Resign</span>
        </Button>
      </div>
    )
  }

  // --- SIDEBAR VARIANT (LAPTOP/DESKTOP/TABLET DETAILS) ---
  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-900/60 text-slate-100 border border-slate-800/80 rounded-xl shadow-xl backdrop-blur-md select-none">
      
      {/* 1. GAME MODE SELECTION */}
      <div className="flex flex-col gap-1.5">
        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Settings2 className="h-3.5 w-3.5 text-amber-500" />
          Game Arena Mode
        </h4>
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-850">
          <button
            onClick={() => setGameMode("vsComputer")}
            className={`py-1.5 px-1 text-[10px] font-extrabold rounded-md flex flex-col items-center justify-center gap-1 transition-all
              ${gameMode === "vsComputer"
                ? "bg-amber-600 text-white shadow"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
          >
            <Bot className="h-3.5 w-3.5" />
            <span>vs Engine</span>
          </button>

          <button
            onClick={() => setGameMode("pvp")}
            className={`py-1.5 px-1 text-[10px] font-extrabold rounded-md flex flex-col items-center justify-center gap-1 transition-all
              ${gameMode === "pvp"
                ? "bg-amber-600 text-white shadow"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Pass & Play</span>
          </button>

          <button
            onClick={() => setGameMode("analysis")}
            className={`py-1.5 px-1 text-[10px] font-extrabold rounded-md flex flex-col items-center justify-center gap-1 transition-all
              ${gameMode === "analysis"
                ? "bg-amber-600 text-white shadow"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Sandbox</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-SETTINGS FOR SELECTED GAME MODE */}
      {gameMode === "vsComputer" && (
        <div className="flex flex-col gap-2.5 p-3 rounded-lg bg-slate-950 border border-slate-850">
          {/* Side selection */}
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">Play As:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setComputerColor("black")} // User plays White
                className={`px-3 py-1 rounded font-bold border transition-all text-[10px]
                  ${computerColor === "black"
                    ? "bg-white text-slate-950 border-white shadow"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                  }`}
              >
                White
              </button>
              <button
                onClick={() => setComputerColor("white")} // User plays Black
                className={`px-3 py-1 rounded font-bold border transition-all text-[10px]
                  ${computerColor === "white"
                    ? "bg-slate-900 text-white border-slate-700 shadow"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                  }`}
              >
                Black
              </button>
            </div>
          </div>

          {/* AI Level slider */}
          <div className="flex flex-col gap-1 border-t border-slate-900 pt-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-400">Engine Difficulty:</span>
              <span className="text-amber-400 font-bold bg-amber-950/60 border border-amber-900 px-1.5 py-0.5 rounded text-[10px]">
                Level {aiLevel} / 8
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              value={aiLevel}
              onChange={(e) => setAiLevel(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer mt-1"
            />
            <div className="flex justify-between text-[8px] text-slate-500 font-bold px-0.5">
              <span>EASY</span>
              <span>MEDIUM</span>
              <span>GRANDMASTER</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. TIME CONTROL PRESES SELECTOR (For PvP and VsComputer only) */}
      {gameMode !== "analysis" && (
        <div className="flex flex-col gap-1.5">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-blue-400" />
            Time Control Control
          </h4>
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-2 rounded-lg border border-slate-850 max-h-[140px] overflow-y-auto">
            {DEFAULT_TIME_CONTROLS.map((tc) => (
              <button
                key={tc.name}
                onClick={() => setTimeControl(tc)}
                className={`py-1 px-1 rounded text-[10px] font-bold border transition-all text-center
                  ${timeControl.name === tc.name
                    ? "bg-blue-600 border-blue-600 text-white font-extrabold shadow"
                    : "bg-slate-900 border-slate-850 text-slate-400 hover:border-slate-700 hover:text-white"
                  }`}
              >
                {tc.name.split(" ")[1]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. BOARD THEMES */}
      <div className="flex flex-col gap-1.5 border-t border-slate-800/80 pt-3">
        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          Board Skin Theme
        </h4>
        <div className="grid grid-cols-5 gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-850">
          {(["emerald", "classic-wood", "ocean", "midnight", "cyberpunk"] as BoardTheme[]).map((theme) => {
            let colorSample = "bg-green-600"
            if (theme === "classic-wood") colorSample = "bg-amber-700"
            else if (theme === "ocean") colorSample = "bg-blue-600"
            else if (theme === "midnight") colorSample = "bg-slate-500"
            else if (theme === "cyberpunk") colorSample = "bg-purple-900"

            return (
              <button
                key={theme}
                onClick={() => setBoardTheme(theme)}
                title={theme.replace("-", " ")}
                className={`group relative flex flex-col items-center p-1 rounded transition-all border
                  ${boardTheme === theme 
                    ? "border-amber-500 bg-amber-500/10 shadow" 
                    : "border-slate-850 bg-slate-900 hover:border-slate-700"
                  }`}
              >
                <div className={`w-5 h-5 rounded-full ${colorSample} border border-slate-950`} />
              </button>
            )
          })}
        </div>
      </div>

      {/* 5. MATCH ACTIONS */}
      <div className="flex flex-col gap-2 border-t border-slate-800/80 pt-3">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={undoMove} className="flex gap-2 items-center bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-900 hover:text-white">
            <Undo2 className="h-4 w-4" />
            Undo
          </Button>
          <Button variant="outline" size="sm" onClick={redoMove} className="flex gap-2 items-center bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-900 hover:text-white">
            <Redo2 className="h-4 w-4" />
            Redo
          </Button>
          <Button variant="outline" size="sm" onClick={offerDraw} disabled={isGameOver} className="flex gap-2 items-center bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-900 hover:text-white">
            <Handshake className="h-4 w-4" />
            Draw
          </Button>
          <Button variant="outline" size="sm" onClick={() => resignGame(currentPlayer)} disabled={isGameOver} className="flex gap-2 items-center bg-slate-950 border-slate-850 text-red-400 hover:bg-red-955/20 hover:text-red-300">
            <Flag className="h-4 w-4 text-red-500" />
            Resign
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsBoardFlipped(!isBoardFlipped)} className="flex gap-2 items-center bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-900 hover:text-white">
            <RefreshCw className="h-4 w-4" />
            Flip Board
          </Button>
          <Button variant="default" onClick={resetGame} className="flex gap-2 items-center bg-amber-600 hover:bg-amber-500 text-white font-bold">
            <RotateCcw className="h-4 w-4" />
            New Match
          </Button>
        </div>
      </div>

      {/* 6. PGN IMPORT / EXPORT */}
      <div className="flex flex-col gap-2 border-t border-slate-800/80 pt-3">
        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">PGN Utilities</h4>
        <div className="grid grid-cols-3 gap-1.5">
          <Button variant="secondary" size="xs" onClick={handleCopyPgn} className="text-[10px] py-1 bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-850">
            {copied ? <Check className="h-3 w-3 text-green-400 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
            Copy
          </Button>

          <Button variant="secondary" size="xs" onClick={handleExportPgnFile} className="text-[10px] py-1 bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-850">
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>

          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="xs" className="text-[10px] py-1 bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-850">
                <Upload className="h-3 w-3 mr-1" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
              <DialogHeader>
                <DialogTitle className="text-slate-100">Import PGN Game</DialogTitle>
              </DialogHeader>
              <div className="p-1">
                <Textarea
                  placeholder="Paste PGN here (e.g. 1. e4 e5 2. Nf3 Nc6...)"
                  value={pgnInput}
                  onChange={(e) => setPgnInput(e.target.value)}
                  className="min-h-[140px] font-mono text-xs bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-500"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportOpen(false)} className="border-slate-850 text-slate-300 hover:bg-slate-900 hover:text-white">Cancel</Button>
                <Button onClick={handleImportSubmit} disabled={!pgnInput.trim()} className="bg-amber-600 hover:bg-amber-500 text-white font-semibold">Load PGN</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 7. ENGINE SUGGESTIONS & ANALYSIS */}
      <div className="flex flex-col gap-2 border-t border-slate-800/80 pt-3">
        <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-850">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Cpu className="h-3.5 w-3.5 text-blue-400" />
            Live Engine Eval
          </span>
          <Button
            size="xs"
            variant={isAnalysisActive ? "default" : "outline"}
            onClick={() => setIsAnalysisActive(!isAnalysisActive)}
            className={`h-6 text-[10px] font-extrabold px-2.5 rounded-md ${isAnalysisActive ? "bg-blue-600 hover:bg-blue-500 text-white" : "border-slate-800 text-slate-400 hover:bg-slate-900"}`}
          >
            <Activity className="h-3 w-3 mr-1" />
            {isAnalysisActive ? "On" : "Off"}
          </Button>
        </div>

        {(isAnalysisActive || gameMode === "vsComputer") && (
          <div className="text-[9px] text-slate-400 font-mono flex flex-col gap-1.5 bg-slate-950 p-2 rounded border border-slate-850/60">
            <div className="flex justify-between">
              <span>Worker State:</span>
              <span className={isEngineReady ? "text-green-400 font-semibold" : "text-amber-500 animate-pulse font-bold"}>
                {isEngineReady ? "ACTIVE (LAZY LOADED)" : "INITIALIZING..."}
              </span>
            </div>
            {bestMoveHint && (
              <div className="flex justify-between items-center border-t border-slate-900 pt-1.5">
                <span>Best Move Hint:</span>
                <span className="text-blue-400 font-black bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-900/40 text-[10px]">
                  {bestMoveHint}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
})

GameControls.displayName = "GameControls"
