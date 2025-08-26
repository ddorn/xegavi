"use client";

import { motion } from "motion/react";
import { pickTextColor } from "@/lib/colors";
import type { BarRaceItem } from "@/lib/barRace";

export interface BarProps {
  item: BarRaceItem;
  widthPct: number; // 0..100
  barHeight: number;
  selected: boolean;
  logo?: React.ReactNode;
  onClick?: () => void;
  transitionDurationSec?: number;
}

export function Bar({ item, widthPct, barHeight, logo, selected, onClick, transitionDurationSec = 1 }: BarProps) {
  const textColor = pickTextColor(item.color);
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
      <div style={{ width: barHeight, height: barHeight }} className="shrink-0 flex items-center justify-center dark:bg-white rounded-lg">
        {logo}
      </div>
      <div className="grow min-w-0" style={{ height: barHeight }}>
        <motion.div
          initial={{ width, opacity: 0 }}
          animate={{ width, opacity: 1 }}
          key={`${item.id}-inner`}
          transition={{ duration: transitionDurationSec, ease: "easeInOut" }}
          style={{ backgroundColor: item.color, height: barHeight }}
          className={`flex justify-between items-center border ${selected ? "" : "border-transparent"}`}
        >
          <div
            className="px-2 sm:px-3 whitespace-nowrap overflow-hidden flex items-center h-full text-xs sm:text-sm"
            style={{ color: textColor }}
            title={`${item.name}: ${item.description}`}
          >
            <span className="font-black">{item.name}</span>
            <span className="ml-2 sm:ml-4 opacity-90 overflow-hidden text-ellipsis">{item.description}</span>
          </div>
          <div className="mx-2 font-semibold text-xs sm:text-sm" style={{ color: textColor }}>
            {Math.round(item.value)}
            </div>
          </motion.div>
      </div>
    </motion.div>
  );
}