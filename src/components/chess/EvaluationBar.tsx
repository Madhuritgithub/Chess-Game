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
  const { percentage, label, blunderClass } = useMemo(() => {
    if (!evaluation) {
      return {
        percentage: 50,
        label: "0.0",
        blunderClass: "text-slate-400"
      }
    }

    const { type, score, blunderStatus } = evaluation
    let labelText = "0.0"
    let scoreVal = 0

    if (type === "mate") {
      labelText = `M${Math.abs(score)}`
      scoreVal = score > 0 ? 10 : -10 // peg to max limits
    } else {
      labelText = score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1)
      scoreVal = score
    }

    // Clamp score between -10 and +10 for visual representation
    const clampedScore = Math.max(-10, Math.min(10, scoreVal))
    
    // Percentage represents White's share of the bar (0% means Black crushing, 100% means White crushing)
    // 0 is 50%. +10 is 100%. -10 is 0%.
    const whitePercentage = 50 + (clampedScore / 20) * 50

    let blunderTextClass = "text-slate-400"
    if (blunderStatus === "blunder") blunderTextClass = "text-red-500 font-bold animate-pulse"
    else if (blunderStatus === "best") blunderTextClass = "text-green-500 font-bold"
    else if (blunderStatus === "mistake") blunderTextClass = "text-amber-500"

    return {
      percentage: whitePercentage,
      label: labelText,
      blunderClass: blunderTextClass
    }
  }, [evaluation])

  const isVertical = orientation === "vertical"

  // Render vertical layout (desktop)
  if (isVertical) {
    return (
      <div className="flex flex-col items-center gap-1.5 h-full py-1">
        <div className="relative w-5 h-[400px] md:h-full bg-slate-950 rounded-full border-2 border-slate-700/60 overflow-hidden flex flex-col justify-end">
          {/* White advantage bar (expands from bottom to top) */}
          <div
            style={{ height: `${percentage}%` }}
            className="w-full bg-slate-100 transition-all duration-500 ease-out"
          />

          {/* Absolute text label placed over the bar */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span
              className={`
                text-[8px] font-bold font-mono px-0.5 py-0.2 rounded mix-blend-difference text-white rotate-90 md:rotate-0
              `}
            >
              {label}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Render horizontal layout (mobile)
  return (
    <div className="flex flex-col gap-1 w-full p-2 bg-slate-900 border border-slate-800 rounded-md select-none">
      <div className="flex justify-between items-center text-[10px] font-mono font-semibold px-1">
        <span className="text-slate-400">Black</span>
        <div className="flex items-center gap-1.5">
          <span className="text-white text-xs font-bold">{label}</span>
          {evaluation?.blunderStatus && evaluation.blunderStatus !== "good" && (
            <span className={`capitalize text-[9px] ${blunderClass}`}>
              ({evaluation.blunderStatus})
            </span>
          )}
        </div>
        <span className="text-white">White</span>
      </div>

      <div className="relative w-full h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden flex">
        {/* Black side of the bar */}
        <div className="h-full bg-slate-950 flex-1" />
        
        {/* White side of the bar (covers percentage from right) */}
        <div
          style={{ width: `${percentage}%` }}
          className="h-full bg-slate-100 transition-all duration-500 ease-out absolute right-0 top-0 bottom-0"
        />

        {/* Center divider line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-700/50 -translate-x-1/2" />
      </div>
    </div>
  )
})

EvaluationBar.displayName = "EvaluationBar"
