"use client"

import React, { useMemo } from "react"
import { ChessPiece } from "../../types/chess"
import { CapturedPieces } from "./CapturedPieces"
import { User, Cpu, ShieldAlert } from "lucide-react"

interface PlayerCardProps {
  name: string
  isComputer: boolean
  computerLevel?: number
  playerColor: "white" | "black"
  isActive: boolean
  captured: ChessPiece[]
  advantage: number
  timeRemaining: number // in seconds
  isTimerActive: boolean
  gameMode: string
}

export const PlayerCard: React.FC<PlayerCardProps> = React.memo(({
  name,
  isComputer,
  computerLevel,
  playerColor,
  isActive,
  captured,
  advantage,
  timeRemaining,
  isTimerActive,
  gameMode
}) => {
  // Format the clock time: mins:secs.tenths if < 10s
  const formattedTime = useMemo(() => {
    if (timeRemaining <= 0) return "0:00.0"
    const minutes = Math.floor(timeRemaining / 60)
    const seconds = Math.floor(timeRemaining % 60)

    if (timeRemaining < 10) {
      const tenths = Math.floor((timeRemaining % 1) * 10)
      return `${seconds}.${tenths}`
    }

    const padSecs = seconds < 10 ? `0${seconds}` : seconds
    return `${minutes}:${padSecs}`
  }, [timeRemaining])

  const isLowTime = timeRemaining > 0 && timeRemaining < 10
  const isTimeZero = timeRemaining <= 0 && gameMode !== "analysis"

  // Render player avatar
  const avatarElement = isComputer ? (
    <div className={`p-2.5 rounded-full bg-blue-950/80 border border-blue-800 text-blue-400 ${isActive ? "animate-pulse" : ""}`}>
      <Cpu className="h-6 w-6" />
    </div>
  ) : (
    <div className={`p-2.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 ${isActive ? "scale-105 transition-transform" : ""}`}>
      <User className="h-6 w-6" />
    </div>
  )

  const sideLabel = playerColor === "white" ? "White" : "Black"

  return (
    <div
      className={`
        w-full p-4 rounded-xl border transition-all duration-300 select-none shadow-lg
        bg-slate-900/40 backdrop-blur-md
        ${isActive 
          ? "border-amber-500/80 ring-1 ring-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)] bg-slate-900/60" 
          : "border-slate-800/80 hover:border-slate-800"
        }
      `}
    >
      <div className="flex justify-between items-center gap-3">
        {/* Left Side: Avatar & Player metadata */}
        <div className="flex items-center gap-3">
          {avatarElement}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">{name}</span>
              <span className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded ${playerColor === "white" ? "bg-white text-slate-950" : "bg-slate-950 text-white border border-slate-800"}`}>
                {sideLabel}
              </span>
            </div>
            <span className="text-xs font-medium text-slate-400">
              {isComputer ? `Engine (Level ${computerLevel})` : "Challenger"}
            </span>
          </div>
        </div>

        {/* Right Side: Digital Clock */}
        {gameMode !== "analysis" && (
          <div
            className={`
              flex flex-col items-end px-3 py-1.5 rounded-lg border font-mono font-bold transition-all duration-300
              ${isTimeZero
                ? "bg-red-950/60 border-red-900 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                : isLowTime
                  ? "bg-red-950/40 border-red-800 text-red-400 animate-pulse text-2xl shadow-[inset_0_0_10px_rgba(239,68,68,0.4)]"
                  : isActive
                    ? "bg-slate-950 border-amber-500/50 text-amber-400 text-xl"
                    : "bg-slate-950/50 border-slate-800 text-slate-400 text-xl"
              }
            `}
          >
            <span className={isLowTime ? "text-3xl font-extrabold" : "text-xl md:text-2xl"}>
              {formattedTime}
            </span>
            {isLowTime && (
              <span className="text-[8px] uppercase tracking-wider font-extrabold text-red-400 flex items-center gap-0.5 mt-0.5">
                <ShieldAlert className="h-2.5 w-2.5 animate-bounce" /> Time Warning
              </span>
            )}
          </div>
        )}
      </div>

      {/* Captured pieces by this player */}
      <div className="mt-3.5 pt-3.5 border-t border-slate-800/80">
        <CapturedPieces captured={captured} playerColor={playerColor} advantage={advantage} />
      </div>
    </div>
  )
})

PlayerCard.displayName = "PlayerCard"
