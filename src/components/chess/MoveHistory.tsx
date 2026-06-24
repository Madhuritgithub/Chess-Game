"use client"

import React, { useEffect, useRef } from "react"
import { MoveHistoryEntry } from "../../types/chess"
import { ScrollArea } from "@/components/ui/scroll-area"

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

  // Auto-scroll to latest move on history changes
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [history.length])

  // Group moves into pairs (White & Black)
  const pairedMoves = React.useMemo(() => {
    const pairs: { moveNum: number; whiteIdx: number; blackIdx: number; whiteSan: string; blackSan: string }[] = []
    
    for (let i = 0; i < history.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1
      pairs.push({
        moveNum,
        whiteIdx: i,
        blackIdx: i + 1,
        whiteSan: history[i].san,
        blackSan: history[i + 1] ? history[i + 1].san : ""
      })
    }
    
    return pairs
  }, [history])

  return (
    <div className="flex flex-col h-full bg-slate-900/60 text-slate-100 border border-slate-800 rounded-lg overflow-hidden shadow-lg">
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex justify-between items-center">
        <h3 className="font-semibold text-sm text-slate-100">Move History</h3>
        <span className="text-xs font-mono text-slate-400">
          {history.length} {history.length === 1 ? "ply" : "plies"}
        </span>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 min-h-[160px] p-2">
        {pairedMoves.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <span className="text-xs text-slate-400 italic">No moves played yet</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                <th className="py-1 px-2 w-12 text-center">#</th>
                <th className="py-1 px-2">White</th>
                <th className="py-1 px-2">Black</th>
              </tr>
            </thead>
            <tbody>
              {pairedMoves.map(({ moveNum, whiteIdx, blackIdx, whiteSan, blackSan }) => {
                const isWhiteActive = historyIndex === whiteIdx
                const isBlackActive = historyIndex === blackIdx

                return (
                  <tr key={moveNum} className="border-b border-slate-950/20 hover:bg-slate-800/30">
                    <td className="py-1.5 px-2 text-center font-mono text-xs text-slate-500 bg-slate-950/20">
                      {moveNum}.
                    </td>
                    <td className="py-1.5 px-2">
                      <button
                        onClick={() => onScrub(whiteIdx)}
                        className={`
                          text-xs md:text-sm font-medium px-2 py-0.5 rounded outline-none transition-colors w-full text-left
                          ${isWhiteActive
                            ? "bg-amber-950/60 text-amber-300 font-semibold shadow-sm border border-amber-900/50"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }
                        `}
                      >
                        {whiteSan}
                      </button>
                    </td>
                    <td className="py-1.5 px-2">
                      {blackSan && (
                        <button
                          onClick={() => onScrub(blackIdx)}
                          className={`
                            text-xs md:text-sm font-medium px-2 py-0.5 rounded outline-none transition-colors w-full text-left
                            ${isBlackActive
                              ? "bg-amber-950/60 text-amber-300 font-semibold shadow-sm border border-amber-900/50"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            }
                          `}
                        >
                          {blackSan}
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
    </div>
  )
})

MoveHistory.displayName = "MoveHistory"
