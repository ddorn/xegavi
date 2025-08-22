"use client";

import { motion } from "motion/react";
import { pickTextColor } from "@/lib/colors";

export interface BarProps {
  idx: number;
  model: string;
  niceModel: string;
  move: string;
  score: number;
  widthPct: number; // 0..100
  color: string;
  barHeight: number;
  logo?: React.ReactNode;
  onClick?: () => void;
  transitionDurationSec?: number;
}

export function Bar({ idx, model, niceModel, move, score, widthPct, color, barHeight, logo, onClick, transitionDurationSec = 1 }: BarProps) {
  const textColor = pickTextColor(color);
  const width = `${Math.max(0, Math.min(100, widthPct)).toFixed(4)}%`;
  return (
    <motion.div
      layout
      initial={false}
      transition={{ duration: transitionDurationSec, ease: "easeInOut" }}
      className="flex items-center gap-2 w-full"
      style={{ height: barHeight }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <div style={{ width: barHeight, height: barHeight }} className="shrink-0 flex items-center justify-center">
        {logo}
      </div>
      <div className="relative grow border border-transparent" style={{ height: barHeight }}>
        <motion.div
          initial={{ width, opacity: 0 }}
          animate={{ width, opacity: 1 }}
          key={`${model}-inner`}
          transition={{ duration: transitionDurationSec, ease: "easeInOut" }}
          style={{ backgroundColor: color, height: barHeight }}
          className="overflow-hidden flex justify-between items-center"
        >
          <div
            className="px-3 whitespace-nowrap overflow-hidden text-ellipsis flex items-center h-full"
            style={{ color: textColor }}
            title={`${niceModel}: ${move}`}
          >
            <span className="font-black">{niceModel}</span>
            <span className="ml-4 opacity-90">{move}</span>
          </div>
          <div className="mr-2 font-semibold" style={{ color: textColor }}>
            {Math.round(score)}
            </div>
          </motion.div>
      </div>
    </motion.div>
  );
}