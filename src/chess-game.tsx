"use client"

import React, { useState, useEffect } from "react"
import { useChessGame } from "./hooks/useChessGame"
import { ChessBoard } from "./components/chess/ChessBoard"
import { CapturedPieces, getMaterialValue } from "./components/chess/CapturedPieces"
import { MoveHistory } from "./components/chess/MoveHistory"
import { GameControls } from "./components/chess/GameControls"
import { PromotionDialog } from "./components/chess/PromotionDialog"
import { EvaluationBar } from "./components/chess/EvaluationBar"
import { InstallPWAButton } from "./components/chess/InstallPWAButton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Crown, AlertCircle, Info, Handshake } from "lucide-react"

export default function ChessGame() {
  const {
    board,
    currentPlayer,
    gameStatus,
    moveHistory,
    historyIndex,
    capturedPieces,
    selectedSquare,
    validMoves,
    promotionPending,
    isAnalysisActive,
    isVsComputer,
    computerColor,
    evaluation,
    bestMoveHint,
    isEngineReady,
    isLive,
    currentFen,
    handleSquareClick,
    handleDoubleTap,
    handlePromoteSelection,
    handleCancelPromotion,
    resetGame,
    resignGame,
    offerDraw,
    undoMove,
    redoMove,
    handleHistoryScrub,
    importPgn,
    exportPgn,
    setIsAnalysisActive,
    setIsVsComputer,
    setComputerColor
  } = useChessGame()

  // Track window width safely for SSR
  const [windowWidth, setWindowWidth] = useState<number>(1024)

  useEffect(() => {
    setWindowWidth(window.innerWidth)
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener("resize", handleResize)

    // Register PWA service worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("SW registered successfully scope:", reg.scope))
        .catch((err) => console.error("SW registration failed:", err))
    }

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Calculate material advantages
  const whiteValue = getMaterialValue(capturedPieces.black) // Captured Black pieces
  const blackValue = getMaterialValue(capturedPieces.white) // Captured White pieces
  const whiteAdvantage = whiteValue > blackValue ? whiteValue - blackValue : 0
  const blackAdvantage = blackValue > whiteValue ? blackValue - whiteValue : 0

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-3 sm:p-6 md:p-8 font-sans pb-[calc(76px+env(safe-area-inset-bottom,0px))] md:pb-8">
      
      {/* Header section */}
      <header className="w-full max-w-7xl flex flex-col sm:flex-row justify-between items-center gap-3 border-b border-slate-900 pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <Crown className="h-7 w-7 text-amber-500 fill-amber-500/20" />
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
            Chess
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">
            Next.js 15
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">
            React 19
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">
            Stockfish Engine
          </span>
        </div>
      </header>

      {/* Game Status Banner Alerts */}
      <div className="w-full max-w-7xl mb-4">
        {gameStatus === "check" && (
          <Alert variant="destructive" className="bg-red-950/40 border-red-900/60 text-red-400 shadow-lg animate-pulse">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-bold text-xs uppercase tracking-wider">King in Check</AlertTitle>
            <AlertDescription className="text-xs">
              {currentPlayer === "white" ? "White" : "Black"} King is currently under attack! Find a legal move to escape check.
            </AlertDescription>
          </Alert>
        )}

        {gameStatus === "checkmate" && (
          <Alert className="bg-emerald-950/60 border-emerald-900/60 text-emerald-400 shadow-xl">
            <Crown className="h-4 w-4" />
            <AlertTitle className="font-bold text-xs uppercase tracking-wider">Checkmate! Game Over</AlertTitle>
            <AlertDescription className="text-xs">
              {currentPlayer === "white" ? "Black" : "White"} wins the game! Play again to improve your skills.
            </AlertDescription>
          </Alert>
        )}

        {gameStatus === "stalemate" && (
          <Alert className="bg-blue-950/50 border-blue-900/50 text-blue-400 shadow-lg">
            <Info className="h-4 w-4" />
            <AlertTitle className="font-bold text-xs uppercase tracking-wider">Stalemate (Draw)</AlertTitle>
            <AlertDescription className="text-xs">
              The active player has no legal moves and is not in check. The game is a draw.
            </AlertDescription>
          </Alert>
        )}

        {gameStatus === "resigned" && (
          <Alert className="bg-slate-900 border-slate-800 text-slate-400 shadow-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-bold text-xs uppercase tracking-wider">Resignation</AlertTitle>
            <AlertDescription className="text-xs">
              The game has ended via resignation. Opponent player wins.
            </AlertDescription>
          </Alert>
        )}

        {gameStatus === "draw-agreement" && (
          <Alert className="bg-blue-950/50 border-blue-900/50 text-blue-400 shadow-lg">
            <Handshake className="h-4 w-4" />
            <AlertTitle className="font-bold text-xs uppercase tracking-wider">Draw Agreement</AlertTitle>
            <AlertDescription className="text-xs">
              The game has ended in a draw by mutual agreement.
            </AlertDescription>
          </Alert>
        )}

        {gameStatus.startsWith("draw-") && gameStatus !== "draw-agreement" && (
          <Alert className="bg-blue-950/50 border-blue-900/50 text-blue-400 shadow-lg">
            <Info className="h-4 w-4" />
            <AlertTitle className="font-bold text-xs uppercase tracking-wider">Game Drawn</AlertTitle>
            <AlertDescription className="text-xs">
              {gameStatus === "draw-material" && "Draw declared due to insufficient mating material."}
              {gameStatus === "draw-fifty-move" && "Draw declared due to 50-move rule (no pawns moved or captures made)."}
              {gameStatus === "draw-repetition" && "Draw declared due to threefold repetition of the position."}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main layout container */}
      <main className="flex flex-col lg:flex-row gap-6 items-stretch justify-center w-full max-w-7xl">
        
        {/* Left Column (Desktop sidebar only): Captured Pieces and PWA Install */}
        <section className="hidden lg:flex flex-col gap-4 w-[210px] shrink-0 justify-start pt-1">
          <CapturedPieces captured={capturedPieces.black} playerColor="white" advantage={whiteAdvantage} />
          <CapturedPieces captured={capturedPieces.white} playerColor="black" advantage={blackAdvantage} />
          
          <div className="mt-2">
            <InstallPWAButton />
          </div>
        </section>

        {/* Center Column: Evaluation Bar and Chess Board */}
        <section className="flex flex-col md:flex-row items-center gap-4 flex-1 justify-center max-w-full">
          {/* Live Engine Evaluation Bar */}
          {isAnalysisActive && (
            <div className="w-full md:w-auto shrink-0 md:h-[400px] sm:max-w-[600px] lg:h-[550px] xl:h-[650px] flex items-stretch">
              <EvaluationBar evaluation={evaluation} orientation={windowWidth >= 768 ? "vertical" : "horizontal"} />
            </div>
          )}

          {/* Chessboard view container */}
          <div className="relative w-full max-w-[100vw] sm:max-w-[600px] lg:max-w-[700px] aspect-square">
            <ChessBoard
              board={board}
              currentPlayer={currentPlayer}
              selectedSquare={selectedSquare}
              validMoves={validMoves}
              moveHistory={moveHistory}
              historyIndex={historyIndex}
              promotionPending={promotionPending}
              handleSquareClick={handleSquareClick}
              handleDoubleTap={handleDoubleTap}
              isVsComputer={isVsComputer}
              computerColor={computerColor}
            />

            {/* Chess Promotion Selector Modal Overlay */}
            <PromotionDialog
              pending={promotionPending}
              color={currentPlayer}
              onSelect={handlePromoteSelection}
              onCancel={handleCancelPromotion}
            />
          </div>
        </section>

        {/* Right Column: Move history & Game Options */}
        <section className="flex flex-col gap-4 w-full lg:w-[320px] shrink-0">
          
          {/* Fallback Captured Pieces (Mobile and Tablet viewports) */}
          <div className="flex lg:hidden gap-3 w-full">
            <CapturedPieces captured={capturedPieces.black} playerColor="white" advantage={whiteAdvantage} />
            <CapturedPieces captured={capturedPieces.white} playerColor="black" advantage={blackAdvantage} />
          </div>

          {/* Interactive PGN move history scrubber panel */}
          <div className="h-[260px] lg:h-[320px]">
            <MoveHistory
              history={moveHistory}
              historyIndex={historyIndex}
              onScrub={handleHistoryScrub}
            />
          </div>

          {/* Fallback PWA Install button for Mobile / Tablet */}
          <div className="block lg:hidden w-full">
            <InstallPWAButton />
          </div>

          {/* Desktop/Tablet game control settings panel */}
          <div className="hidden md:block">
            <GameControls
              variant="sidebar"
              currentPlayer={currentPlayer}
              gameStatus={gameStatus}
              isVsComputer={isVsComputer}
              computerColor={computerColor}
              isAnalysisActive={isAnalysisActive}
              isEngineReady={isEngineReady}
              bestMoveHint={bestMoveHint}
              isLive={isLive}
              undoMove={undoMove}
              redoMove={redoMove}
              resetGame={resetGame}
              resignGame={resignGame}
              offerDraw={offerDraw}
              exportPgn={exportPgn}
              importPgn={importPgn}
              setIsVsComputer={setIsVsComputer}
              setComputerColor={setComputerColor}
              setIsAnalysisActive={setIsAnalysisActive}
            />
          </div>
        </section>
      </main>

      {/* Mobile Sticky Action Bar floating at viewport bottom */}
      <GameControls
        variant="sticky"
        currentPlayer={currentPlayer}
        gameStatus={gameStatus}
        isVsComputer={isVsComputer}
        computerColor={computerColor}
        isAnalysisActive={isAnalysisActive}
        isEngineReady={isEngineReady}
        bestMoveHint={bestMoveHint}
        isLive={isLive}
        undoMove={undoMove}
        redoMove={redoMove}
        resetGame={resetGame}
        resignGame={resignGame}
        offerDraw={offerDraw}
        exportPgn={exportPgn}
        importPgn={importPgn}
        setIsVsComputer={setIsVsComputer}
        setComputerColor={setComputerColor}
        setIsAnalysisActive={setIsAnalysisActive}
      />
    </div>
  )
}
