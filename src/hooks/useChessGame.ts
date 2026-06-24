import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  Board,
  Position,
  ChessPiece,
  PieceColor,
  CastlingRights,
  MoveHistoryEntry,
  GameStatus,
  EvaluationInfo,
  Move,
  PieceType
} from "../types/chess"
import { getLegalMoves, isKingInCheck, isCheckmate, isStalemate, isInsufficientMaterial, isThreefoldRepetition } from "../lib/game-rules"
import { generateFen, parseFen, moveToSan, exportToPgn, parsePgnMoves, posToSquare, squareToPos } from "../lib/notation"

const initialBoard: Board = [
  [
    { type: "rook", color: "black" },
    { type: "knight", color: "black" },
    { type: "bishop", color: "black" },
    { type: "queen", color: "black" },
    { type: "king", color: "black" },
    { type: "bishop", color: "black" },
    { type: "knight", color: "black" },
    { type: "rook", color: "black" }
  ],
  [
    { type: "pawn", color: "black" },
    { type: "pawn", color: "black" },
    { type: "pawn", color: "black" },
    { type: "pawn", color: "black" },
    { type: "pawn", color: "black" },
    { type: "pawn", color: "black" },
    { type: "pawn", color: "black" },
    { type: "pawn", color: "black" }
  ],
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  [
    { type: "pawn", color: "white" },
    { type: "pawn", color: "white" },
    { type: "pawn", color: "white" },
    { type: "pawn", color: "white" },
    { type: "pawn", color: "white" },
    { type: "pawn", color: "white" },
    { type: "pawn", color: "white" },
    { type: "pawn", color: "white" }
  ],
  [
    { type: "rook", color: "white" },
    { type: "knight", color: "white" },
    { type: "bishop", color: "white" },
    { type: "queen", color: "white" },
    { type: "king", color: "white" },
    { type: "bishop", color: "white" },
    { type: "knight", color: "white" },
    { type: "rook", color: "white" }
  ]
]

const initialCastling: CastlingRights = {
  white: { kingside: true, queenside: true },
  black: { kingside: true, queenside: true }
}

export function useChessGame() {
  // --- Game Core States ---
  const [board, setBoard] = useState<Board>(initialBoard)
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>("white")
  const [castlingRights, setCastlingRights] = useState<CastlingRights>(initialCastling)
  const [enPassantTarget, setEnPassantTarget] = useState<Position | null>(null)
  const [halfmoveClock, setHalfmoveClock] = useState<number>(0)
  const [fullmoveNumber, setFullmoveNumber] = useState<number>(1)

  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<Position[]>([])
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing")
  const [moveHistory, setMoveHistory] = useState<MoveHistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = useState<number>(-1) // -1 means live

  // --- Pawn Promotion State ---
  const [promotionPending, setPromotionPending] = useState<{ from: Position; to: Position } | null>(null)

  // --- Stockfish States ---
  const [isAnalysisActive, setIsAnalysisActive] = useState<boolean>(false)
  const [isVsComputer, setIsVsComputer] = useState<boolean>(false)
  const [computerColor, setComputerColor] = useState<PieceColor>("black")
  const [stockfishDepth, setStockfishDepth] = useState<number>(12)
  const [evaluation, setEvaluation] = useState<EvaluationInfo | null>(null)
  const [bestMoveHint, setBestMoveHint] = useState<string | null>(null)
  const [isEngineReady, setIsEngineReady] = useState<boolean>(false)

  const workerRef = useRef<Worker | null>(null)
  const prevEvalRef = useRef<number>(0) // for blunder check

  // --- Dynamic Getters for History Navigation ---
  // When reviewing history, we render the board at the historical move.
  const activeState = useMemo(() => {
    if (historyIndex === -1 || historyIndex === moveHistory.length) {
      return {
        board,
        currentPlayer,
        castlingRights,
        enPassantTarget,
        halfmoveClock,
        fullmoveNumber,
        isLive: true
      }
    }
    const historicalEntry = moveHistory[historyIndex]
    const state = parseFen(historicalEntry.fenAfter)
    return {
      board: state.board,
      currentPlayer: state.currentPlayer,
      castlingRights: state.castlingRights,
      enPassantTarget: state.enPassantTarget,
      halfmoveClock: state.halfmoveClock,
      fullmoveNumber: state.fullmoveNumber,
      isLive: false
    }
  }, [board, currentPlayer, castlingRights, enPassantTarget, halfmoveClock, fullmoveNumber, moveHistory, historyIndex])

  // Get current FEN
  const currentFen = useMemo(() => {
    return generateFen(
      activeState.board,
      activeState.currentPlayer,
      activeState.castlingRights,
      activeState.enPassantTarget,
      activeState.halfmoveClock,
      activeState.fullmoveNumber
    )
  }, [activeState])

  // Compute captured pieces dynamically based on history scrub point
  const capturedPieces = useMemo(() => {
    const whiteCaptured: ChessPiece[] = []
    const blackCaptured: ChessPiece[] = []

    const limit = historyIndex === -1 ? moveHistory.length : historyIndex + 1
    for (let i = 0; i < limit && i < moveHistory.length; i++) {
      const move = moveHistory[i]
      if (move.captured) {
        if (move.captured.color === "white") {
          blackCaptured.push(move.captured) // captured by black
        } else {
          whiteCaptured.push(move.captured) // captured by white
        }
      }
    }

    return { white: whiteCaptured, black: blackCaptured }
  }, [moveHistory, historyIndex])

  // Detect and set Stockfish depth based on device screen width
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 768) {
        setStockfishDepth(10) // Mobile (optimized depth)
      } else {
        setStockfishDepth(15) // Desktop (deeper calculation)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // --- Stockfish Web Worker Lifecycle (Lazy Loaded) ---
  useEffect(() => {
    const shouldStartEngine = isAnalysisActive || (isVsComputer && currentPlayer === computerColor)
    if (!shouldStartEngine) {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
        setIsEngineReady(false)
        setEvaluation(null)
        setBestMoveHint(null)
      }
      return
    }

    if (!workerRef.current) {
      console.log("Initializing Stockfish Web Worker...")
      workerRef.current = new Worker("/stockfish.worker.js")
      
      workerRef.current.onmessage = (e: MessageEvent) => {
        const line = e.data
        // console.log("Engine:", line);

        if (line === "readyok") {
          setIsEngineReady(true)
        }

        // Parse bestmove
        if (line.startsWith("bestmove")) {
          const parts = line.split(" ")
          const move = parts[1]
          if (move && move !== "(none)") {
            setBestMoveHint(move)
          }
        }

        // Parse info (evaluation)
        if (line.startsWith("info") && line.includes("score")) {
          const parts = line.split(" ")
          const scoreIndex = parts.indexOf("score")
          if (scoreIndex !== -1) {
            const scoreType = parts[scoreIndex + 1] // "cp" or "mate"
            const scoreVal = parseInt(parts[scoreIndex + 2], 10)
            
            let finalScore = scoreVal
            // Normalize score from White's perspective
            // Stockfish returns score relative to active player. If active player is black, invert it.
            if (activeState.currentPlayer === "black" && !isNaN(finalScore)) {
              finalScore = -finalScore
            }

            if (scoreType === "cp") {
              setEvaluation((prev) => ({
                score: finalScore / 100, // convert centipawns to pawn units
                type: "cp",
                bestMove: prev?.bestMove,
                blunderStatus: prev?.blunderStatus
              }))
            } else if (scoreType === "mate") {
              setEvaluation((prev) => ({
                score: finalScore,
                type: "mate",
                bestMove: prev?.bestMove,
                blunderStatus: prev?.blunderStatus
              }))
            }
          }
        }
      }

      workerRef.current.postMessage("uci")
      workerRef.current.postMessage("isready")
      workerRef.current.postMessage("ucinewgame")
    }

    // Update position and trigger search when current FEN changes
    if (workerRef.current && isEngineReady) {
      workerRef.current.postMessage(`position fen ${currentFen}`)
      workerRef.current.postMessage(`go depth ${stockfishDepth}`)
    }
  }, [isAnalysisActive, isVsComputer, computerColor, currentFen, isEngineReady, stockfishDepth, activeState.currentPlayer])

  // --- Game State Resetter ---
  const resetGame = useCallback(() => {
    setBoard(initialBoard)
    setCurrentPlayer("white")
    setCastlingRights(initialCastling)
    setEnPassantTarget(null)
    setHalfmoveClock(0)
    setFullmoveNumber(1)
    setSelectedSquare(null)
    setValidMoves([])
    setGameStatus("playing")
    setMoveHistory([])
    setHistoryIndex(-1)
    setPromotionPending(null)
    setEvaluation(null)
    setBestMoveHint(null)
    prevEvalRef.current = 0
  }, [])

  // --- Move Applier (Core Logic) ---
  const applyMove = useCallback((
    from: Position,
    to: Position,
    promoPiece?: PieceType
  ) => {
    if (!activeState.isLive) {
      // If user is scrubbing history, slice the history up to the current scrub index
      const newHistory = moveHistory.slice(0, historyIndex === -1 ? moveHistory.length : historyIndex + 1)
      setMoveHistory(newHistory)
      setHistoryIndex(-1)
    }

    const movingPiece = board[from.row][from.col]
    if (!movingPiece) return

    const newBoard = board.map((row) => [...row])
    const capturedPiece = board[to.row][to.col]
    let actualCaptured = capturedPiece

    const fenBefore = generateFen(board, currentPlayer, castlingRights, enPassantTarget, halfmoveClock, fullmoveNumber)

    let isCastling: Move["isCastling"]
    let isEnPassant = false

    // 1. Handle Castling move execution
    if (movingPiece.type === "king" && Math.abs(from.col - to.col) === 2) {
      const startRow = currentPlayer === "white" ? 7 : 0
      if (to.col === 6) {
        // Kingside castling: move Rook from H to F
        const rook = newBoard[startRow][7]
        newBoard[startRow][5] = rook ? { ...rook, hasMoved: true } : null
        newBoard[startRow][7] = null
        isCastling = "kingside"
      } else if (to.col === 2) {
        // Queenside castling: move Rook from A to D
        const rook = newBoard[startRow][0]
        newBoard[startRow][3] = rook ? { ...rook, hasMoved: true } : null
        newBoard[startRow][0] = null
        isCastling = "queenside"
      }
    }

    // 2. Handle En Passant execution
    if (movingPiece.type === "pawn" && enPassantTarget && to.row === enPassantTarget.row && to.col === enPassantTarget.col) {
      // Captured pawn is on the same column, but on the starting pawn's row
      newBoard[from.row][to.col] = null
      actualCaptured = board[from.row][to.col] // grab captured en passant pawn
      isEnPassant = true
    }

    // 3. Move the piece
    const movedPiece: ChessPiece = { ...movingPiece, hasMoved: true }
    if (promoPiece) {
      movedPiece.type = promoPiece
    }
    newBoard[to.row][to.col] = movedPiece
    newBoard[from.row][from.col] = null

    // 4. Update Castling Rights state
    const nextCastling = {
      white: { ...castlingRights.white },
      black: { ...castlingRights.black }
    }

    // King moves invalidate all castling rights
    if (movingPiece.type === "king") {
      nextCastling[currentPlayer].kingside = false
      nextCastling[currentPlayer].queenside = false
    }

    // Rook moves invalidate specific side castling rights
    if (movingPiece.type === "rook") {
      const startRow = currentPlayer === "white" ? 7 : 0
      if (from.row === startRow) {
        if (from.col === 7) nextCastling[currentPlayer].kingside = false
        if (from.col === 0) nextCastling[currentPlayer].queenside = false
      }
    }

    // Rook captured in corner invalidates opponent rights
    const opponent = currentPlayer === "white" ? "black" : "white"
    const oppStartRow = opponent === "white" ? 7 : 0
    if (to.row === oppStartRow) {
      if (to.col === 7) nextCastling[opponent].kingside = false
      if (to.col === 0) nextCastling[opponent].queenside = false
    }

    // 5. Update En Passant target state
    let nextEpTarget: Position | null = null
    if (movingPiece.type === "pawn" && Math.abs(from.row - to.row) === 2) {
      // The square behind the jumped pawn
      nextEpTarget = {
        row: from.row + (currentPlayer === "white" ? -1 : 1),
        col: from.col
      }
    }

    // 6. Halfmove clock updating (reset on pawn moves or captures, increment otherwise)
    const isPawnMove = movingPiece.type === "pawn"
    const isCapture = !!actualCaptured
    const nextHalfmove = (isPawnMove || isCapture) ? 0 : halfmoveClock + 1

    // 7. Fullmove increment
    const nextFullmove = currentPlayer === "black" ? fullmoveNumber + 1 : fullmoveNumber

    // Prepare temp values to generate SAN
    const nextPlayer = currentPlayer === "white" ? "black" : "white"
    const checkAfter = isKingInCheck(nextPlayer, newBoard)
    const checkmateAfter = isCheckmate(nextPlayer, newBoard, nextCastling, nextEpTarget)
    const stalemateAfter = isStalemate(nextPlayer, newBoard, nextCastling, nextEpTarget)
    const materialDrawAfter = isInsufficientMaterial(newBoard)
    const fiftyMoveDrawAfter = nextHalfmove >= 100

    const moveObj: Move = {
      from,
      to,
      piece: movingPiece,
      captured: actualCaptured,
      promotion: promoPiece,
      isCastling,
      isEnPassant
    }

    const san = moveToSan(moveObj, board, castlingRights, enPassantTarget, checkAfter, checkmateAfter)
    const fenAfter = generateFen(newBoard, nextPlayer, nextCastling, nextEpTarget, nextHalfmove, nextFullmove)

    const historyEntry: MoveHistoryEntry = {
      ...moveObj,
      san,
      fenBefore,
      fenAfter,
      castlingRightsBefore: castlingRights,
      enPassantTargetBefore: enPassantTarget,
      halfmoveClockBefore: halfmoveClock,
      fullmoveNumberBefore: fullmoveNumber
    }

    const repetitionDrawAfter = isThreefoldRepetition(fenAfter, moveHistory)

    // Trigger state changes
    setBoard(newBoard)
    setCurrentPlayer(nextPlayer)
    setCastlingRights(nextCastling)
    setEnPassantTarget(nextEpTarget)
    setHalfmoveClock(nextHalfmove)
    setFullmoveNumber(nextFullmove)
    setSelectedSquare(null)
    setValidMoves([])

    // Update history
    setMoveHistory((prev) => [...prev, historyEntry])

    // Update game status
    if (checkmateAfter) {
      setGameStatus("checkmate")
    } else if (stalemateAfter) {
      setGameStatus("stalemate")
    } else if (materialDrawAfter) {
      setGameStatus("draw-material")
    } else if (fiftyMoveDrawAfter) {
      setGameStatus("draw-fifty-move")
    } else if (repetitionDrawAfter) {
      setGameStatus("draw-repetition")
    } else if (checkAfter) {
      setGameStatus("check")
    } else {
      setGameStatus("playing")
    }

    // Blunder Detection / Move Analysis
    if (evaluation) {
      const prevEval = prevEvalRef.current
      const currentEval = evaluation.score
      const diff = currentPlayer === "white" ? (currentEval - prevEval) : (prevEval - currentEval)

      let blunderStatus: EvaluationInfo["blunderStatus"] = "good"
      if (diff <= -2.0) {
        blunderStatus = "blunder"
      } else if (diff <= -1.0) {
        blunderStatus = "mistake"
      } else if (diff <= -0.5) {
        blunderStatus = "inaccuracy"
      } else if (diff >= 0.2) {
        blunderStatus = "best"
      }

      setEvaluation((prev) => prev ? { ...prev, blunderStatus } : null)
      prevEvalRef.current = currentEval
    }
  }, [board, currentPlayer, castlingRights, enPassantTarget, halfmoveClock, fullmoveNumber, moveHistory, historyIndex, evaluation])

  // --- Square Click Handling ---
  const handleSquareClick = useCallback((row: number, col: number) => {
    if (gameStatus === "checkmate" || gameStatus === "stalemate" || gameStatus.startsWith("draw")) {
      return
    }

    // If a promotion dialog is active, block board taps
    if (promotionPending) return

    // If it's computer's turn in PvC mode, block human inputs
    if (isVsComputer && currentPlayer === computerColor) return

    const clickedPiece = activeState.board[row][col]

    if (selectedSquare) {
      // Check if clicking a valid move square
      const targetMove = validMoves.find((m) => m.row === row && m.col === col)

      if (targetMove) {
        const piece = activeState.board[selectedSquare.row][selectedSquare.col]
        const isPawnPromotion =
          piece?.type === "pawn" &&
          (row === 0 || row === 7)

        if (isPawnPromotion) {
          // Open promotion modal
          setPromotionPending({ from: selectedSquare, to: { row, col } })
        } else {
          applyMove(selectedSquare, { row, col })
        }
      } else {
        // Deselect or select another piece of own color
        if (clickedPiece && clickedPiece.color === currentPlayer) {
          setSelectedSquare({ row, col })
          const moves = getLegalMoves(clickedPiece, row, col, activeState.board, activeState.castlingRights, activeState.enPassantTarget)
          setValidMoves(moves)
        } else {
          setSelectedSquare(null)
          setValidMoves([])
        }
      }
    } else {
      // Select piece
      if (clickedPiece && clickedPiece.color === currentPlayer) {
        setSelectedSquare({ row, col })
        const moves = getLegalMoves(clickedPiece, row, col, activeState.board, activeState.castlingRights, activeState.enPassantTarget)
        setValidMoves(moves)
      }
    }
  }, [selectedSquare, validMoves, activeState, currentPlayer, gameStatus, promotionPending, isVsComputer, computerColor, applyMove])

  // Double tap to deselect
  const handleDoubleTap = useCallback((row: number, col: number) => {
    if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
      setSelectedSquare(null)
      setValidMoves([])
    }
  }, [selectedSquare])

  // Complete pawn promotion
  const handlePromoteSelection = useCallback((pieceType: PieceType) => {
    if (promotionPending) {
      applyMove(promotionPending.from, promotionPending.to, pieceType)
      setPromotionPending(null)
    }
  }, [promotionPending, applyMove])

  // Cancel promotion
  const handleCancelPromotion = useCallback(() => {
    setPromotionPending(null)
    setSelectedSquare(null)
    setValidMoves([])
  }, [])

  // --- Game Actions ---
  const resignGame = useCallback((color: PieceColor) => {
    setGameStatus("resigned")
  }, [])

  const offerDraw = useCallback(() => {
    setGameStatus("draw-agreement")
  }, [])

  // Navigation History scrubber
  const handleHistoryScrub = useCallback((index: number) => {
    if (index >= -1 && index < moveHistory.length) {
      setHistoryIndex(index)
      setSelectedSquare(null)
      setValidMoves([])
    }
  }, [moveHistory])

  const undoMove = useCallback(() => {
    const activeIndex = historyIndex === -1 ? moveHistory.length : historyIndex
    if (activeIndex > 0) {
      handleHistoryScrub(activeIndex - 1)
    }
  }, [historyIndex, moveHistory, handleHistoryScrub])

  const redoMove = useCallback(() => {
    const activeIndex = historyIndex === -1 ? moveHistory.length : historyIndex
    if (activeIndex < moveHistory.length) {
      handleHistoryScrub(activeIndex + 1)
    }
  }, [historyIndex, moveHistory, handleHistoryScrub])

  // --- PGN Import / Export ---
  const importPgn = useCallback((pgnText: string) => {
    try {
      resetGame()
      const rawMoves = parsePgnMoves(pgnText)
      
      // We will play moves sequentially on a temporary board state
      let tempBoard = initialBoard.map((row) => [...row])
      let tempPlayer: PieceColor = "white"
      let tempCastling = { ...initialCastling }
      let tempEp: Position | null = null
      let tempHalfmove = 0
      let tempFullmove = 1
      const tempHistory: MoveHistoryEntry[] = []

      for (const sanStr of rawMoves) {
        // Clean sanStr
        const cleanSan = sanStr.replace(/[+#]/g, "")
        let foundMove: { from: Position; to: Position; promo?: PieceType } | null = null

        // Parse cleanSan to find matching move on current tempState
        if (cleanSan === "O-O" || cleanSan === "O-O-O") {
          const row = tempPlayer === "white" ? 7 : 0
          const toCol = cleanSan === "O-O" ? 6 : 2
          foundMove = { from: { row, col: 4 }, to: { row, col: toCol } }
        } else {
          // Normal moves
          let pieceType: PieceType = "pawn"
          let targetStr = cleanSan
          let promoPiece: PieceType | undefined

          if (cleanSan.includes("=")) {
            const promoParts = cleanSan.split("=")
            targetStr = promoParts[0]
            const promoChar = promoParts[1][0]
            if (promoChar === "Q") promoPiece = "queen"
            if (promoChar === "R") promoPiece = "rook"
            if (promoChar === "B") promoPiece = "bishop"
            if (promoChar === "N") promoPiece = "knight"
          }

          if (/^[NBRQK]/.test(targetStr)) {
            const char = targetStr[0]
            if (char === "N") pieceType = "knight"
            if (char === "B") pieceType = "bishop"
            if (char === "R") pieceType = "rook"
            if (char === "Q") pieceType = "queen"
            if (char === "K") pieceType = "king"
            targetStr = targetStr.slice(1)
          }

          // Strip capture 'x'
          targetStr = targetStr.replace("x", "")
          const toSquare = targetStr.slice(-2)
          const disambig = targetStr.slice(0, -2) // remaining chars are disambiguation

          const toPos = squareToPos(toSquare)

          // Find candidate piece that can move to target
          let candidate: Position | null = null
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              const p = tempBoard[r][c]
              if (p && p.color === tempPlayer && p.type === pieceType) {
                // Check if it fits disambiguation
                if (disambig) {
                  if (disambig.length === 1) {
                    if (FILES.includes(disambig)) {
                      if (c !== FILES.indexOf(disambig)) continue
                    } else if (RANKS.includes(disambig)) {
                      if (r !== RANKS.indexOf(disambig)) continue
                    }
                  } else if (disambig.length === 2) {
                    const dPos = squareToPos(disambig)
                    if (r !== dPos.row || c !== dPos.col) continue
                  }
                }

                const legal = getLegalMoves(p, r, c, tempBoard, tempCastling, tempEp)
                if (legal.some((m) => m.row === toPos.row && m.col === toPos.col)) {
                  candidate = { row: r, col: c }
                  break
                }
              }
            }
            if (candidate) break
          }

          if (candidate) {
            foundMove = { from: candidate, to: toPos, promo: promoPiece }
          }
        }

        if (!foundMove) {
          throw new Error(`Failed to parse move: ${sanStr}`)
        }

        // Apply it on temp state
        const movingPiece = tempBoard[foundMove.from.row][foundMove.from.col]!
        const capturedPiece = tempBoard[foundMove.to.row][foundMove.to.col]
        let actualCaptured = capturedPiece

        const fenBefore = generateFen(tempBoard, tempPlayer, tempCastling, tempEp, tempHalfmove, tempFullmove)

        let isCastling: Move["isCastling"]
        let isEnPassant = false

        if (movingPiece.type === "king" && Math.abs(foundMove.from.col - foundMove.to.col) === 2) {
          const startRow = tempPlayer === "white" ? 7 : 0
          if (foundMove.to.col === 6) {
            const rook = tempBoard[startRow][7]
            tempBoard[startRow][5] = rook ? { ...rook, hasMoved: true } : null
            tempBoard[startRow][7] = null
            isCastling = "kingside"
          } else if (foundMove.to.col === 2) {
            const rook = tempBoard[startRow][0]
            tempBoard[startRow][3] = rook ? { ...rook, hasMoved: true } : null
            tempBoard[startRow][0] = null
            isCastling = "queenside"
          }
        }

        if (movingPiece.type === "pawn" && tempEp && foundMove.to.row === tempEp.row && foundMove.to.col === tempEp.col) {
          tempBoard[foundMove.from.row][foundMove.to.col] = null
          actualCaptured = tempBoard[foundMove.from.row][foundMove.to.col]
          isEnPassant = true
        }

        const movedPiece = { ...movingPiece, hasMoved: true }
        if (foundMove.promo) {
          movedPiece.type = foundMove.promo
        }
        tempBoard[foundMove.to.row][foundMove.to.col] = movedPiece
        tempBoard[foundMove.from.row][foundMove.from.col] = null

        // castling rights updating
        if (movingPiece.type === "king") {
          tempCastling[tempPlayer].kingside = false
          tempCastling[tempPlayer].queenside = false
        }
        if (movingPiece.type === "rook") {
          const startRow = tempPlayer === "white" ? 7 : 0
          if (foundMove.from.row === startRow) {
            if (foundMove.from.col === 7) tempCastling[tempPlayer].kingside = false
            if (foundMove.from.col === 0) tempCastling[tempPlayer].queenside = false
          }
        }
        const opp = tempPlayer === "white" ? "black" : "white"
        const oppStartRow = opp === "white" ? 7 : 0
        if (foundMove.to.row === oppStartRow) {
          if (foundMove.to.col === 7) tempCastling[opp].kingside = false
          if (foundMove.to.col === 0) tempCastling[opp].queenside = false
        }

        // en passant updating
        let nextEp: Position | null = null
        if (movingPiece.type === "pawn" && Math.abs(foundMove.from.row - foundMove.to.row) === 2) {
          nextEp = {
            row: foundMove.from.row + (tempPlayer === "white" ? -1 : 1),
            col: foundMove.from.col
          }
        }

        const nextHalfmove = (movingPiece.type === "pawn" || !!actualCaptured) ? 0 : tempHalfmove + 1
        const nextFullmove = tempPlayer === "black" ? tempFullmove + 1 : tempFullmove
        const nextPlayer = tempPlayer === "white" ? "black" : "white"

        const checkAfter = isKingInCheck(nextPlayer, tempBoard)
        const checkmateAfter = isCheckmate(nextPlayer, tempBoard, tempCastling, nextEp)

        const moveObj: Move = {
          from: foundMove.from,
          to: foundMove.to,
          piece: movingPiece,
          captured: actualCaptured,
          promotion: foundMove.promo,
          isCastling,
          isEnPassant
        }

        const fenAfter = generateFen(tempBoard, nextPlayer, tempCastling, nextEp, nextHalfmove, nextFullmove)

        const entry: MoveHistoryEntry = {
          ...moveObj,
          san: sanStr,
          fenBefore,
          fenAfter,
          castlingRightsBefore: tempCastling,
          enPassantTargetBefore: tempEp,
          halfmoveClockBefore: tempHalfmove,
          fullmoveNumberBefore: tempFullmove
        }

        tempHistory.push(entry)

        tempBoard = tempBoard
        tempPlayer = nextPlayer
        tempCastling = tempCastling
        tempEp = nextEp
        tempHalfmove = nextHalfmove
        tempFullmove = nextFullmove
      }

      // Sync state with successfully played history
      setBoard(tempBoard)
      setCurrentPlayer(tempPlayer)
      setCastlingRights(tempCastling)
      setEnPassantTarget(tempEp)
      setHalfmoveClock(tempHalfmove)
      setFullmoveNumber(tempFullmove)
      setMoveHistory(tempHistory)
      setHistoryIndex(-1)

      const lastEntry = tempHistory[tempHistory.length - 1]
      if (lastEntry) {
        const nextP = tempPlayer
        const check = isKingInCheck(nextP, tempBoard)
        const checkmate = isCheckmate(nextP, tempBoard, tempCastling, tempEp)
        const stalemate = isStalemate(nextP, tempBoard, tempCastling, tempEp)
        const material = isInsufficientMaterial(tempBoard)
        const fifty = tempHalfmove >= 100
        const repetition = isThreefoldRepetition(lastEntry.fenAfter, tempHistory)

        if (checkmate) setGameStatus("checkmate")
        else if (stalemate) setGameStatus("stalemate")
        else if (material) setGameStatus("draw-material")
        else if (fifty) setGameStatus("draw-fifty-move")
        else if (repetition) setGameStatus("draw-repetition")
        else if (check) setGameStatus("check")
        else setGameStatus("playing")
      }
    } catch (e: any) {
      console.error(e)
      alert("Error importing PGN: " + e.message)
    }
  }, [resetGame])

  const exportPgn = useCallback(() => {
    return exportToPgn(moveHistory)
  }, [moveHistory])

  // --- Computer Auto-Move Execution (vs Computer Mode) ---
  useEffect(() => {
    if (isVsComputer && currentPlayer === computerColor && gameStatus === "playing" && bestMoveHint) {
      // Wait 500ms to simulate computer thinking
      const timer = setTimeout(() => {
        const fromSquare = bestMoveHint.slice(0, 2)
        const toSquare = bestMoveHint.slice(2, 4)
        const promoChar = bestMoveHint[4]

        const from = squareToPos(fromSquare)
        const to = squareToPos(toSquare)

        let promoPiece: PieceType | undefined
        if (promoChar) {
          if (promoChar === "q") promoPiece = "queen"
          if (promoChar === "r") promoPiece = "rook"
          if (promoChar === "b") promoPiece = "bishop"
          if (promoChar === "n") promoPiece = "knight"
        }

        applyMove(from, to, promoPiece)
        setBestMoveHint(null) // clear best move
      }, 600)

      return () => clearTimeout(timer)
    }
  }, [isVsComputer, currentPlayer, computerColor, gameStatus, bestMoveHint, applyMove])

  return {
    board: activeState.board,
    currentPlayer: activeState.currentPlayer,
    castlingRights: activeState.castlingRights,
    enPassantTarget: activeState.enPassantTarget,
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
    isLive: activeState.isLive,
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
  }
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]
