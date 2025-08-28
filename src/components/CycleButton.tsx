"use client";

import React from "react";

export interface CycleButtonProps<T extends string | number> {
  value: T;
  steps: readonly T[];
  onChange: (next: T) => void;
  format?: (v: T) => string;
  className?: string;
  ariaLabel?: string;
}

export function CycleButton<T extends string | number>({
  value,
  steps,
  onChange,
  format,
  className,
  ariaLabel,
}: CycleButtonProps<T>) {
  const index = Math.max(0, steps.indexOf(value));
  const next = steps[(index + 1) % steps.length];
  const label = format ? format(value) : String(value);

  return (
    <button
      type="button"
      className={className ?? "button"}
      onClick={() => onChange(next)}
      aria-label={ariaLabel ?? "Cycle value"}
    >
      {label}
    </button>
  );
}