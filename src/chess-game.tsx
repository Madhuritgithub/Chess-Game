"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useChessGame } from "./hooks/useChessGame"
import { ChessBoard } from "./components/chess/ChessBoard"
import { getMaterialValue } from "./components/chess/CapturedPieces"
import { MoveHistory } from "./components/chess/MoveHistory"
import { GameControls } from "./components/chess/GameControls"
import { PromotionDialog } from "./components/chess/PromotionDialog"
import { EvaluationBar } from "./components/chess/EvaluationBar"
import { InstallPWAButton } from "./components/chess/InstallPWAButton"
import { PlayerCard } from "./components/chess/PlayerCard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Crown, AlertCircle, Info, Handshake, ChevronDown, ChevronUp, Swords, HelpCircle } from "lucide-react"

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
    setComputerColor,

    // Premium state fields
    gameMode,
    setGameMode,
    boardTheme,
    setBoardTheme,
    isBoardFlipped,
    setIsBoardFlipped,
    aiLevel,
    setAiLevel,
    timeControl,
    setTimeControl,
    whiteTime,
    setWhiteTime,
    blackTime,
    setBlackTime,
    isTimerActive,
    setIsTimerActive
  } = useChessGame()

  // Track window width safely for SSR
  const [windowWidth, setWindowWidth] = useState<number>(1024)

  // Mobile Accordion toggles
  const [isMoveLogExpanded, setIsMoveLogExpanded] = useState(false)
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false)
  const [isEngineExpanded, setIsEngineExpanded] = useState(false)

  useEffect(() => {
    setWindowWidth(window.innerWidth)
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener("resize", handleResize)

    // Register PWA service worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("SW registered scope:", reg.scope))
        .catch((err) => console.error("SW registration failed:", err))
    }

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Calculate material advantages
  const whiteValue = getMaterialValue(capturedPieces.black) // Captured Black pieces
  const blackValue = getMaterialValue(capturedPieces.white) // Captured White pieces
  const whiteAdvantage = whiteValue > blackValue ? whiteValue - blackValue : 0
  const blackAdvantage = blackValue > whiteValue ? blackValue - whiteValue : 0

  // Calculate player profiles
  const whitePlayerName = useMemo(() => {
    if (gameMode === "vsComputer") {
      return computerColor === "white" ? `Stockfish AI` : "Challenger (You)"
    }
    if (gameMode === "pvp") {
      return "Player 1"
    }
    return "White Player"
  }, [gameMode, computerColor])

  const blackPlayerName = useMemo(() => {
    if (gameMode === "vsComputer") {
      return computerColor === "black" ? `Stockfish AI` : "Challenger (You)"
    }
    if (gameMode === "pvp") {
      return "Player 2"
    }
    return "Black Player"
  }, [gameMode, computerColor])

  // Map cards based on flipped board state
  const topCard = isBoardFlipped ? (
    <PlayerCard
      name={whitePlayerName}
      isComputer={gameMode === "vsComputer" && computerColor === "white"}
      computerLevel={aiLevel}
      playerColor="white"
      isActive={currentPlayer === "white" && (gameStatus === "playing" || gameStatus === "check")}
      captured={capturedPieces.black}
      advantage={whiteAdvantage}
      timeRemaining={whiteTime}
      isTimerActive={isTimerActive}
      gameMode={gameMode}
    />
  ) : (
    <PlayerCard
      name={blackPlayerName}
      isComputer={gameMode === "vsComputer" && computerColor === "black"}
      computerLevel={aiLevel}
      playerColor="black"
      isActive={currentPlayer === "black" && (gameStatus === "playing" || gameStatus === "check")}
      captured={capturedPieces.white}
      advantage={blackAdvantage}
      timeRemaining={blackTime}
      isTimerActive={isTimerActive}
      gameMode={gameMode}
    />
  )

  const leftSidebarCard = isBoardFlipped ? (
    <PlayerCard
      name={blackPlayerName}
      isComputer={gameMode === "vsComputer" && computerColor === "black"}
      computerLevel={aiLevel}
      playerColor="black"
      isActive={currentPlayer === "black" && (gameStatus === "playing" || gameStatus === "check")}
      captured={capturedPieces.white}
      advantage={blackAdvantage}
      timeRemaining={blackTime}
      isTimerActive={isTimerActive}
      gameMode={gameMode}
    />
  ) : (
    <PlayerCard
      name={whitePlayerName}
      isComputer={gameMode === "vsComputer" && computerColor === "white"}
      computerLevel={aiLevel}
      playerColor="white"
      isActive={currentPlayer === "white" && (gameStatus === "playing" || gameStatus === "check")}
      captured={capturedPieces.black}
      advantage={whiteAdvantage}
      timeRemaining={whiteTime}
      isTimerActive={isTimerActive}
      gameMode={gameMode}
    />
  )

  const isDesktop = windowWidth >= 1024

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-3 sm:p-5 md:p-6 font-sans pb-[calc(68px+env(safe-area-inset-bottom,0px))] lg:pb-6">
      
      {/* Header Branding section */}
      <header className="w-full max-w-7xl flex flex-col sm:flex-row justify-between items-center gap-3 border-b border-slate-900 pb-4 mb-5 select-none">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
              PC CHESS
            </h1>
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500">
              Grandmaster Engine Suite
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[9px] uppercase font-black tracking-wider px-2.5 py-1 bg-slate-905 border border-slate-850 rounded-md text-amber-400 bg-amber-950/20">
            {gameMode === "vsComputer" ? "VS STOCKFISH" : gameMode === "pvp" ? "PASS & PLAY" : "SANDBOX"}
          </span>
          <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">
            Stockfish 15
          </span>
        </div>
      </header>

      {/* Game Status Banner Alerts */}
      <div className="w-full max-w-7xl mb-4 select-none">
        {gameStatus === "check" && (
          <Alert variant="destructive" className="bg-red-950/40 border-red-900/60 text-red-400 shadow-lg animate-pulse">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-bold text-xs uppercase tracking-wider">King in Check</AlertTitle>
            <AlertDescription className="text-xs">
              {currentPlayer === "white" ? "White" : "Black"} King is under attack! Find a legal escape.
            </AlertDescription>
          </Alert>
        )}

        {gameStatus === "checkmate" && (
          <Alert className="bg-emerald-950/60 border-emerald-900/60 text-emerald-400 shadow-xl border-2">
            <Crown className="h-4 w-4 text-emerald-400" />
            <AlertTitle className="font-bold text-xs uppercase tracking-wider">Checkmate! Game Over</AlertTitle>
            <AlertDescription className="text-xs">
              {currentPlayer === "white" ? "Black" : "White"} wins! Select &quot;New Match&quot; to challenge again.
            </AlertDescription>
          </Alert>
        )}

        {gameStatus === "stalemate" && (
          <Alert className="bg-blue-950/50 border-blue-900/50 text-blue-400 shadow-lg">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertTitle className="font-bold text-xs uppercase tracking-wider">Stalemate (Draw)</AlertTitle>
            <AlertDescription className="text-xs">
              No legal moves left. The match is a draw.
            </AlertDescription>
          </Alert>
        )}

        {gameStatus === "resigned" && (
          <Alert className="bg-slate-900 border-slate-850 text-slate-400 shadow-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-bold text-xs uppercase tracking-wider">Resignation</AlertTitle>
            <AlertDescription className="text-xs">
              Match ended by resignation.
            </AlertDescription>
          </Alert>
        )}

        {gameStatus === "draw-agreement" && (
          <Alert className="bg-blue-950/50 border-blue-900/50 text-blue-400 shadow-lg">
            <Handshake className="h-4 w-4" />
            <AlertTitle className="font-bold text-xs uppercase tracking-wider">Draw Agreement</AlertTitle>
            <AlertDescription className="text-xs">
              Match drawn by mutual agreement.
            </AlertDescription>
          </Alert>
        )}

        {gameStatus.startsWith("timeout-") && (
          <Alert variant="destructive" className="bg-red-950/50 border-red-900 text-red-400 shadow-lg border-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-bold text-xs uppercase tracking-wider">Flag Fallen! Timeout</AlertTitle>
            <AlertDescription className="text-xs font-semibold">
              {gameStatus === "timeout-white" ? "White" : "Black"} ran out of time! Opponent wins.
            </AlertDescription>
          </Alert>
        )}

        {gameStatus.startsWith("draw-") && gameStatus !== "draw-agreement" && (
          <Alert className="bg-blue-950/50 border-blue-900/50 text-blue-400 shadow-lg">
            <Info className="h-4 w-4" />
            <AlertTitle className="font-bold text-xs uppercase tracking-wider">Game Drawn</AlertTitle>
            <AlertDescription className="text-xs">
              {gameStatus === "draw-material" && "Insufficient mating material."}
              {gameStatus === "draw-fifty-move" && "Fifty-move rule (no pawns moved or captures made)."}
              {gameStatus === "draw-repetition" && "Threefold repetition of the position."}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* --- DESKTOP GRID LAYOUT --- */}
      {isDesktop ? (
        <main className="grid grid-cols-12 gap-6 items-start justify-center w-full max-w-7xl">
          {/* Left Column (Left Sidebar) */}
          <section className="col-span-3 flex flex-col gap-5 justify-start">
            {leftSidebarCard}
            <InstallPWAButton />
            
            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl select-none">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                PC Match Arena
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Play against Stockfish AI up to Level 8, challenge a friend pass-and-play style, or load custom PGN files to scrub and analyze. Enable live evaluations to watch blunders and suggestions on the fly.
              </p>
            </div>
          </section>

          {/* Center Column (Board & Eval bar) */}
          <section className="col-span-6 flex flex-col items-center gap-4 justify-center">
            {/* Top Opponent Card */}
            {topCard}

            {/* Board Wrapper with vertical evaluation bar */}
            <div className="flex items-stretch gap-4 w-full justify-center">
              {isAnalysisActive && (
                <div className="w-7 h-[460px] xl:h-[550px] flex items-stretch">
                  <EvaluationBar evaluation={evaluation} orientation="vertical" />
                </div>
              )}

              <div className="relative flex-1 max-w-[460px] xl:max-w-[550px] aspect-square">
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
                  theme={boardTheme}
                  isBoardFlipped={isBoardFlipped}
                />

                <PromotionDialog
                  pending={promotionPending}
                  color={currentPlayer}
                  onSelect={handlePromoteSelection}
                  onCancel={handleCancelPromotion}
                />
              </div>
            </div>
          </section>

          {/* Right Column (Move Log & Controls) */}
          <section className="col-span-3 flex flex-col gap-5">
            <div className="h-[280px] xl:h-[340px]">
              <MoveHistory
                history={moveHistory}
                historyIndex={historyIndex}
                onScrub={handleHistoryScrub}
              />
            </div>

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
              
              gameMode={gameMode}
              setGameMode={setGameMode}
              boardTheme={boardTheme}
              setBoardTheme={setBoardTheme}
              isBoardFlipped={isBoardFlipped}
              setIsBoardFlipped={setIsBoardFlipped}
              aiLevel={aiLevel}
              setAiLevel={setAiLevel}
              timeControl={timeControl}
              setTimeControl={setTimeControl}
            />
          </section>
        </main>
      ) : (
        /* --- MOBILE/TABLET STACK LAYOUT (BOARD FIRST) --- */
        <main className="flex flex-col gap-4 items-center w-full max-w-[600px] select-none">
          
          {/* Horizontal Eval Bar */}
          {isAnalysisActive && (
            <div className="w-full">
              <EvaluationBar evaluation={evaluation} orientation="horizontal" />
            </div>
          )}

          {/* Opponent Card (top) */}
          <div className="w-full">
            {topCard}
          </div>

          {/* Board Aspect Container */}
          <div className="relative w-full aspect-square">
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
              theme={boardTheme}
              isBoardFlipped={isBoardFlipped}
            />

            <PromotionDialog
              pending={promotionPending}
              color={currentPlayer}
              onSelect={handlePromoteSelection}
              onCancel={handleCancelPromotion}
            />
          </div>

          {/* Player Card (bottom) */}
          <div className="w-full">
            {leftSidebarCard}
          </div>

          {/* Mobile Accordions for Panels */}
          <div className="w-full flex flex-col gap-2.5 mt-3 select-none">
            
            {/* Accordion 1: Move History */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/30">
              <button
                onClick={() => setIsMoveLogExpanded(!isMoveLogExpanded)}
                className="w-full px-4 py-3 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-900/40"
              >
                <span className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  Show Move Log
                </span>
                {isMoveLogExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {isMoveLogExpanded && (
                <div className="h-[280px] p-2 border-t border-slate-800 bg-slate-950/40">
                  <MoveHistory
                    history={moveHistory}
                    historyIndex={historyIndex}
                    onScrub={handleHistoryScrub}
                  />
                </div>
              )}
            </div>

            {/* Accordion 2: Game Settings & Themes */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/30">
              <button
                onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
                className="w-full px-4 py-3 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-900/40"
              >
                <span className="flex items-center gap-2">
                  <Swords className="h-4 w-4 text-blue-400" />
                  Arena Settings & Themes
                </span>
                {isSettingsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {isSettingsExpanded && (
                <div className="p-3 border-t border-slate-800 bg-slate-950/40">
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
                    
                    gameMode={gameMode}
                    setGameMode={setGameMode}
                    boardTheme={boardTheme}
                    setBoardTheme={setBoardTheme}
                    isBoardFlipped={isBoardFlipped}
                    setIsBoardFlipped={setIsBoardFlipped}
                    aiLevel={aiLevel}
                    setAiLevel={setAiLevel}
                    timeControl={timeControl}
                    setTimeControl={setTimeControl}
                  />
                </div>
              )}
            </div>

            {/* Accordion 3: Engine Stats */}
            {isAnalysisActive && (
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/30">
                <button
                  onClick={() => setIsEngineExpanded(!isEngineExpanded)}
                  className="w-full px-4 py-3 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-900/40"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-emerald-400" />
                    Engine analysis status
                  </span>
                  {isEngineExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {isEngineExpanded && (
                  <div className="p-3.5 border-t border-slate-800 bg-slate-950/40 text-xs font-mono text-slate-400 flex flex-col gap-1.5">
                    <div className="flex justify-between">
                      <span>Engine Ready:</span>
                      <span className={isEngineReady ? "text-green-400" : "text-amber-500"}>
                        {isEngineReady ? "Yes" : "Initializing..."}
                      </span>
                    </div>
                    {bestMoveHint && (
                      <div className="flex justify-between">
                        <span>Best Move Recommendation:</span>
                        <span className="text-blue-400 font-extrabold">{bestMoveHint}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="w-full mt-1.5">
              <InstallPWAButton />
            </div>
          </div>
        </main>
      )}

      {/* Mobile Sticky bottom navigation actions */}
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
        
        gameMode={gameMode}
        setGameMode={setGameMode}
        boardTheme={boardTheme}
        setBoardTheme={setBoardTheme}
        isBoardFlipped={isBoardFlipped}
        setIsBoardFlipped={setIsBoardFlipped}
        aiLevel={aiLevel}
        setAiLevel={setAiLevel}
        timeControl={timeControl}
        setTimeControl={setTimeControl}
      />
    </div>
  )
}
