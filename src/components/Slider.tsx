"use client";

import React from "react";

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "min" | "max" | "step" | "type"> {
  min: number;
  max: number;
  step?: number;
  value: number;
  onValueChange: (value: number) => void;
}

export function Slider({ min, max, step = 1, value, onValueChange, className, ...rest }: SliderProps) {
  const clamped = Math.max(min, Math.min(value, max));
  const percent = max > min ? ((clamped - min) / (max - min)) * 100 : 0;
  const style = { ["--slider-value"]: `${percent}%` } as React.CSSProperties;

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={clamped}
      onChange={(e) => onValueChange(Number(e.target.value))}
      className={`slider w-full${className ? ` ${className}` : ""}`}
      style={style}
      {...rest}
    />
  );
}