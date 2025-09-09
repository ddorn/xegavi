"use client";

import React, { createContext, useContext } from "react";

export interface ColorScaleContextValue {
  maxAbsScore: number;
}

const ColorScaleContext = createContext<ColorScaleContextValue | undefined>(undefined);

export interface ColorScaleProviderProps {
  maxAbsScore: number;
  children: React.ReactNode;
}

export function ColorScaleProvider({ maxAbsScore, children }: ColorScaleProviderProps) {
  return <ColorScaleContext.Provider value={{ maxAbsScore: maxAbsScore }}>{children}</ColorScaleContext.Provider>;
}

export function useColorScale(): ColorScaleContextValue {
  const ctx = useContext(ColorScaleContext);
  if (!ctx) {
    console.warn("ColorScaleContext not found, using default maxAbsScore of 10");
  }
  return ctx ?? { maxAbsScore: 10 };
}