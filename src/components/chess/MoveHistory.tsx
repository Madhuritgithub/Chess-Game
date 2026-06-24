"use client"

import React, { useEffect, useRef, useState, useMemo } from "react"
import { MoveHistoryEntry } from "../../types/chess"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Play,
  Pause,
  Sliders
} from "lucide-react"

interface MoveHistoryProps {
  history: MoveHistoryEntry[]
  historyIndex: number
  onScrub: (index: number) => void
}

export const MoveHistory: React.FC<MoveHistoryProps> = React.memo(({
  history,
  historyIndex,
  onScrub
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Auto-play state
  const [isPlaying, setIsPlaying] = useState(false)
  const [playSpeed, setPlaySpeed] = useState(1000) // ms between moves
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-scroll to latest move on history changes
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [history.length])

  // Navigation handlers
  const currentIndex = historyIndex === -1 ? history.length - 1 : historyIndex

  const goToStart = () => {
    setIsPlaying(false)
    onScrub(-1) // Reset to start would technically be before move 0. Let's make index -2 or just a start indicator. Wait, scrub index -1 is the live position (end of game).
    // Let's use index = -1 as live, and if we want to go to the very start of game, we should render index -1 as start?
    // Wait, let's look at useChessGame.ts activeState:
    // "historyIndex === -1 || historyIndex === moveHistory.length" renders board at live.
    // If index === 0, it renders state after move 1 (White's first move).
    // If we want to scrub to BEFORE any moves are played, how do we do it?
    // Oh, wait, in useChessGame, historyIndex is -1 to moveHistory.length - 1.
    // Wait! Let's check how activeState is structured:
    // If historyIndex === -1: live
    // If historyIndex is 0: parseFen(moveHistory[0].fenAfter)
    // So there is NO index to review the starting position (before any moves)!
    // That's fine, we can scrub back to index 0, or let's support going to starting board if we want, but keeping index 0 as first move is standard. Let's make:
    // - Start: go to index 0 (which shows state after first move, or let's check: going to index -1 or 0)
    // Actually, let's keep index 0 as first move.
    onScrub(0)
  }

  const goToEnd = () => {
    setIsPlaying(false)
    onScrub(-1) // Live
  }

  const stepBackward = () => {
    setIsPlaying(false)
    if (historyIndex === -1) {
      if (history.length > 0) {
        onScrub(history.length - 2)
      }
    } else if (historyIndex > 0) {
      onScrub(historyIndex - 1)
    }
  }

  const stepForward = () => {
    setIsPlaying(false)
    if (historyIndex !== -1 && historyIndex < history.length - 1) {
      onScrub(historyIndex + 1)
    } else if (historyIndex === history.length - 1) {
      onScrub(-1) // Live
    }
  }

  // Auto-play effect
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        if (historyIndex === -1 || historyIndex >= history.length - 1) {
          setIsPlaying(false)
          onScrub(-1)
        } else {
          onScrub(historyIndex + 1)
        }
      }, playSpeed)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, historyIndex, history.length, playSpeed, onScrub])

  // Group moves into pairs (White & Black)
  const pairedMoves = useMemo(() => {
    const pairs: { moveNum: number; whiteIdx: number; blackIdx: number; whiteEntry: MoveHistoryEntry; blackEntry: MoveHistoryEntry | null }[] = []
    
    for (let i = 0; i < history.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1
      pairs.push({
        moveNum,
        whiteIdx: i,
        blackIdx: i + 1,
        whiteEntry: history[i],
        blackEntry: history[i + 1] ? history[i + 1] : null
      })
    }
    
    return pairs
  }, [history])

  // Get blunder dot colors
  const getQualityStyle = (status?: string) => {
    switch (status) {
      case "best":
        return { dot: "bg-green-400 shadow-[0_0_6px_#22c55e]", text: "text-green-400" }
      case "good":
        return { dot: "bg-blue-400 shadow-[0_0_6px_#3b82f6]", text: "text-blue-400" }
      case "inaccuracy":
        return { dot: "bg-yellow-500", text: "text-yellow-500" }
      case "mistake":
        return { dot: "bg-orange-500", text: "text-orange-500" }
      case "blunder":
        return { dot: "bg-red-500 shadow-[0_0_6px_#ef4444] animate-pulse", text: "text-red-500" }
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/60 text-slate-100 border border-slate-800/80 rounded-xl overflow-hidden shadow-lg backdrop-blur-md">
      {/* Header */}
      <div className="bg-slate-950 border-b border-slate-850 p-3.5 flex justify-between items-center select-none">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">Move Log</h3>
        <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">
          {history.length} {history.length === 1 ? "PLY" : "PLIES"}
        </span>
      </div>

      {/* Move Lists Table */}
      <ScrollArea ref={scrollRef} className="flex-1 min-h-[140px] p-3">
        {pairedMoves.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-28 text-center select-none">
            <span className="text-xs text-slate-500 italic">No moves recorded</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse select-none">
            <thead>
              <tr className="text-[9px] uppercase font-extrabold text-slate-400 border-b border-slate-800/60">
                <th className="py-1 px-1 w-10 text-center font-mono">#</th>
                <th className="py-1 px-2">White</th>
                <th className="py-1 px-2">Black</th>
              </tr>
            </thead>
            <tbody>
              {pairedMoves.map(({ moveNum, whiteIdx, blackIdx, whiteEntry, blackEntry }) => {
                const isWhiteActive = historyIndex === whiteIdx
                const isBlackActive = historyIndex === blackIdx

                const whiteQuality = getQualityStyle(whiteEntry.blunderStatus)
                const blackQuality = blackEntry ? getQualityStyle(blackEntry.blunderStatus) : null

                return (
                  <tr key={moveNum} className="border-b border-slate-950/20 hover:bg-slate-800/20 transition-colors">
                    <td className="py-1.5 px-1 text-center font-mono text-xs font-bold text-slate-500 bg-slate-950/30">
                      {moveNum}
                    </td>
                    
                    {/* White Move Cell */}
                    <td className="py-1.5 px-2">
                      <button
                        onClick={() => onScrub(whiteIdx)}
                        className={`
                          text-xs md:text-sm font-semibold px-2 py-1 rounded outline-none transition-all w-full text-left flex items-center justify-between
                          ${isWhiteActive
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                            : "text-slate-200 hover:bg-slate-800/40 hover:text-white"
                          }
                        `}
                      >
                        <span>{whiteEntry.san}</span>
                        {whiteQuality && (
                          <div 
                            title={`Move evaluated as: ${whiteEntry.blunderStatus}`} 
                            className={`w-2 h-2 rounded-full ${whiteQuality.dot}`}
                          />
                        )}
                      </button>
                    </td>

                    {/* Black Move Cell */}
                    <td className="py-1.5 px-2">
                      {blackEntry && (
                        <button
                          onClick={() => onScrub(blackIdx)}
                          className={`
                            text-xs md:text-sm font-semibold px-2 py-1 rounded outline-none transition-all w-full text-left flex items-center justify-between
                            ${isBlackActive
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                              : "text-slate-200 hover:bg-slate-800/40 hover:text-white"
                            }
                          `}
                        >
                          <span>{blackEntry.san}</span>
                          {blackQuality && (
                            <div 
                              title={`Move evaluated as: ${blackEntry.blunderStatus}`} 
                              className={`w-2 h-2 rounded-full ${blackQuality.dot}`}
                            />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </ScrollArea>

      {/* Playback Controls Footer Bar */}
      <div className="bg-slate-950/90 border-t border-slate-850 p-2 flex flex-col gap-2 select-none">
        
        {/* Playback buttons */}
        <div className="flex justify-around items-center">
          <Button
            variant="ghost"
            size="xs"
            onClick={goToStart}
            disabled={history.length === 0 || historyIndex === 0}
            className="text-slate-400 hover:text-white disabled:opacity-30 p-1"
          >
            <ChevronsLeft className="h-4.5 w-4.5" />
          </Button>

          <Button
            variant="ghost"
            size="xs"
            onClick={stepBackward}
            disabled={history.length === 0 || historyIndex === 0}
            className="text-slate-400 hover:text-white disabled:opacity-30 p-1"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </Button>

          <Button
            variant="ghost"
            size="xs"
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={history.length === 0 || historyIndex === -1}
            className="text-slate-400 hover:text-white disabled:opacity-30 p-1.5 rounded-full bg-slate-900 border border-slate-800"
          >
            {isPlaying ? <Pause className="h-4.5 w-4.5 text-amber-400" /> : <Play className="h-4.5 w-4.5" />}
          </Button>

          <Button
            variant="ghost"
            size="xs"
            onClick={stepForward}
            disabled={history.length === 0 || historyIndex === -1}
            className="text-slate-400 hover:text-white disabled:opacity-30 p-1"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </Button>

          <Button
            variant="ghost"
            size="xs"
            onClick={goToEnd}
            disabled={history.length === 0 || historyIndex === -1}
            className="text-slate-400 hover:text-white disabled:opacity-30 p-1"
          >
            <ChevronsRight className="h-4.5 w-4.5" />
          </Button>
        </div>

        {/* Speed Controls Slider */}
        {isPlaying && (
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-[10px]">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <Sliders className="h-3 w-3" />
              <span>Speed:</span>
            </div>
            <div className="flex gap-1.5">
              {[500, 1000, 2000, 3000].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaySpeed(speed)}
                  className={`px-1.5 py-0.5 rounded font-mono font-bold border transition-all
                    ${playSpeed === speed
                      ? "bg-amber-600/20 text-amber-400 border-amber-600/50"
                      : "bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300"
                    }`}
                >
                  {speed / 1000}s
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

MoveHistory.displayName = "MoveHistory"
