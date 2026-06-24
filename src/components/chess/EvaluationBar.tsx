"use client"

import React, { useMemo } from "react"
import { EvaluationInfo } from "../../types/chess"

interface EvaluationBarProps {
  evaluation: EvaluationInfo | null
  orientation?: "vertical" | "horizontal"
}

export const EvaluationBar: React.FC<EvaluationBarProps> = React.memo(({
  evaluation,
  orientation = "vertical"
}) => {
  // Compute percentage and text label
  const { percentage, label, blunderClass, isWhiteAdvantage } = useMemo(() => {
    if (!evaluation) {
      return {
        percentage: 50,
        label: "0.0",
        blunderClass: "text-slate-400",
        isWhiteAdvantage: true
      }
    }

    const { type, score, blunderStatus } = evaluation
    let labelText = "0.0"
    let scoreVal = 0

    if (type === "mate") {
      labelText = score > 0 ? `Mate in ${Math.abs(score)}` : `Mate in -${Math.abs(score)}`
      scoreVal = score > 0 ? 10 : -10
    } else {
      labelText = score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1)
      scoreVal = score
    }

    // Clamp score between -10 and +10 for visual bar bounds
    const clampedScore = Math.max(-8, Math.min(8, scoreVal))
    
    // Percentage represents White's share of the bar (0% is Black crushing, 100% is White crushing)
    const whitePercentage = 50 + (clampedScore / 16) * 50

    let blunderTextClass = "text-slate-400"
    if (blunderStatus === "blunder") blunderTextClass = "text-red-500 font-extrabold animate-pulse"
    else if (blunderStatus === "best") blunderTextClass = "text-green-400 font-bold"
    else if (blunderStatus === "mistake") blunderTextClass = "text-amber-500 font-semibold"
    else if (blunderStatus === "inaccuracy") blunderTextClass = "text-yellow-600"

    return {
      percentage: whitePercentage,
      label: labelText,
      blunderClass: blunderTextClass,
      isWhiteAdvantage: scoreVal >= 0
    }
  }, [evaluation])

  const isVertical = orientation === "vertical"

  // Render vertical layout (Desktop dashboard side-bar next to board)
  if (isVertical) {
    return (
      <div className="flex flex-col items-center h-full py-1">
        <div className="relative w-7 h-[420px] md:h-full bg-slate-900 rounded-full border-2 border-slate-800 shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col justify-end">
          {/* White advantage bar (expands from bottom to top) */}
          <div
            style={{ height: `${percentage}%` }}
            className="w-full bg-slate-50 transition-all duration-700 ease-out shadow-[0_0_12px_rgba(255,255,255,0.2)]"
          />

          {/* Absolute text label placed over the bar */}
          <div className="absolute inset-0 flex flex-col items-center justify-between py-4 pointer-events-none select-none">
            <span className="text-[9px] font-black font-mono text-slate-500 uppercase tracking-widest rotate-90 md:rotate-0">
              B
            </span>
            <span
              className={`
                text-[10px] font-black font-mono px-1 py-0.5 rounded shadow-sm text-center
                ${isWhiteAdvantage ? "text-slate-950 bg-slate-200/90" : "text-white bg-slate-800/90"}
                rotate-90 md:rotate-0 transition-colors duration-300
              `}
            >
              {label}
            </span>
            <span className="text-[9px] font-black font-mono text-slate-400 uppercase tracking-widest rotate-90 md:rotate-0">
              W
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Render horizontal layout (Mobile screen top view)
  return (
    <div className="flex flex-col gap-1.5 w-full p-3 bg-slate-900/60 backdrop-blur border border-slate-800 rounded-xl select-none shadow-md">
      <div className="flex justify-between items-center text-[10px] font-mono font-bold px-1.5">
        <span className="text-slate-500 uppercase tracking-wider">Black</span>
        <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          <span className={`text-xs font-black ${isWhiteAdvantage ? "text-slate-100" : "text-slate-300"}`}>
            {label}
          </span>
          {evaluation?.blunderStatus && evaluation.blunderStatus !== "good" && (
            <span className={`capitalize text-[9px] font-extrabold ${blunderClass}`}>
              • {evaluation.blunderStatus}
            </span>
          )}
        </div>
        <span className="text-slate-300 uppercase tracking-wider">White</span>
      </div>

      <div className="relative w-full h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden flex shadow-inner">
        {/* Black side of the bar */}
        <div className="h-full bg-slate-900 flex-1" />
        
        {/* White side of the bar (covers percentage from right) */}
        <div
          style={{ width: `${percentage}%` }}
          className="h-full bg-slate-50 transition-all duration-700 ease-out absolute right-0 top-0 bottom-0 shadow-lg"
        />

        {/* Center divider line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-700/60 -translate-x-1/2" />
      </div>
    </div>
  )
})

EvaluationBar.displayName = "EvaluationBar"
