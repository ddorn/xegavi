"use client";

import React from "react";

export interface BarRaceControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  round: number;
  maxRound: number;
  totalRounds: number;
  onSeek: (round: number) => void;
  disabled?: boolean;
  speed: number;
  onCycleSpeed: () => void;
}

export function BarRaceControls({
  isPlaying,
  onTogglePlay,
  round,
  maxRound,
  totalRounds,
  onSeek,
  disabled = false,
  speed,
  onCycleSpeed,
}: BarRaceControlsProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        className="button"
        onClick={onTogglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
        disabled={disabled && !isPlaying}
      >
        {isPlaying ? "Pause" : "Play"}
      </button>
      <button
        type="button"
        className="button"
        onClick={onCycleSpeed}
        aria-label="Change speed"
        disabled={disabled}
      >
        {`${speed}x`}
      </button>
      <div className="flex-1 flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={maxRound}
          step={1}
          value={Math.min(round, maxRound)}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="w-full"
          aria-label="Round"
          disabled={disabled}
        />
        <span className="tabular-nums text-sm min-w-[4.5rem] text-right">
          {totalRounds === 0 ? "0/0" : `${Math.min(round, maxRound) + 1}/${totalRounds}`}
        </span>
      </div>
    </div>
  );
}