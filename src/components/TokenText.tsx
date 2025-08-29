"use client";

import React from "react";
import type { TokenScores } from "@/lib/types";

export interface TokenTextProps {
  tokenScores: TokenScores;
  className?: string;
}

export function TokenText({ tokenScores, className }: TokenTextProps) {
  return (
    <span className={"text-neutral-900 dark:text-neutral-100 " + (className ?? "")}>
      {tokenScores.map(([tok], i) => (
        <span key={i} className="px-0.5">{tok}</span>
      ))}
    </span>
  );
}