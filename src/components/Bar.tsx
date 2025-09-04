"use client";

import { motion } from "motion/react";
import { pickTextColor } from "@/lib/colors";
import type { BarRaceItem } from "@/lib/barRace";

export interface BarProps {
  item: BarRaceItem;
  widthPct: number; // 0..100
  barHeight: number;
  logo?: React.ReactNode;
  onClick?: () => void;
  transitionDurationSec?: number;
  textColorOverride?: string;
  solidBackground?: boolean; // when false, do not apply item.color background (used by full overlay mode)
  slots?: {
    prefix?: React.ReactNode; // placed between logo and bar fill, self-sized
    overlay?: React.ReactNode; // absolute overlay covering the bar fill
    footer?: React.ReactNode; // absolute bottom stripe inside the bar fill
  };
}

export function Bar({ item, widthPct, barHeight, logo, onClick, transitionDurationSec = 1, textColorOverride, solidBackground = true, slots }: BarProps) {
  const computedTextColor = textColorOverride ?? pickTextColor(item.color);
  const width = `${Math.max(0, Math.min(100, widthPct)).toFixed(4)}%`;
  return (
    <div
      className="flex items-center gap-2 w-full"
      style={{ height: barHeight }}
    >
        {slots?.prefix}
      <div style={{ width: barHeight, height: barHeight }} className="shrink-0 flex items-center justify-center dark:bg-white rounded-lg">
        {logo}
      </div>
      <div className="grow min-w-0 flex" style={{ height: barHeight }}>
        <motion.div
          initial={{ width, opacity: 0 }}
          animate={{ width, opacity: 1 }}
          key={`${item.id}-inner`}
          transition={{ duration: transitionDurationSec}}
          style={solidBackground ? { backgroundColor: item.color, height: barHeight } : { height: barHeight }}
          className={`relative overflow-hidden flex justify-between items-center border border-transparent`}
          onClick={onClick}
          data-bar-id={item.id}
          data-bar-name={item.name}
        >
          {slots?.overlay}
          <div
            className="px-2 sm:px-3 whitespace-nowrap overflow-hidden flex items-center h-full text-xs sm:text-sm z-10"
            style={{ color: computedTextColor }}
            title={`${item.name}: ${item.description}`}
          >
            <span className="font-black">{item.name}</span>
            {/* <span className="ml-2 sm:ml-4 opacity-90 overflow-hidden text-ellipsis">{item.description}</span> */}
          </div>
          <div className="mx-2 font-semibold text-xs sm:text-sm z-10" style={{ color: computedTextColor }}>
            {item.value.toFixed(1)}
            </div>
          {slots?.footer}
          </motion.div>
      </div>
    </div>
  );
}