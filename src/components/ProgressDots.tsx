"use client";

import React from "react";

export interface ProgressDotsProps {
  count: number;
  activeIndex: number;
  onSelect?: (index: number) => void;
  className?: string;
}

export function ProgressDots({ count, activeIndex, onSelect, className }: ProgressDotsProps) {
  if (count <= 0) return null;
  return (
    <div className={"flex items-center justify-center gap-2 " + (className ?? "")}
         role="tablist" aria-label="Examples">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Example ${i + 1}`}
          aria-selected={i === activeIndex}
          className={`h-2 w-2 rounded-full transition-[width,background-color] duration-200 ${i === activeIndex ? "w-6 bg-neutral-900 dark:bg-neutral-100" : "bg-neutral-300 dark:bg-neutral-700"}`}
          onClick={() => onSelect?.(i)}
        />
      ))}
    </div>
  );
}