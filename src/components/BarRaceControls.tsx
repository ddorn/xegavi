"use client";

import React from "react";

export interface BarRaceControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  round: number;
  maxRound: number;
  totalRounds: number;
  onSeek: (round: number) => void;
  speed: number;
  onSetSpeed: (speed: number) => void;
}

export function BarRaceControls({
  isPlaying,
  onTogglePlay,
  round,
  maxRound,
  totalRounds,
  onSeek,
  speed,
  onSetSpeed,
}: BarRaceControlsProps) {
  const SPEED_STEPS = [0.25, 0.5, 1, 1.5, 2] as const;
  const currentIndex = Math.max(0, SPEED_STEPS.indexOf((speed as typeof SPEED_STEPS[number]) ?? 1));
  const cycle = () => onSetSpeed(SPEED_STEPS[(currentIndex + 1) % SPEED_STEPS.length]);
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        className="button"
        onClick={onTogglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? "Pause" : "Play"}
      </button>
      <button
        type="button"
        className="button"
        onClick={cycle}
        aria-label="Change speed"
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
        />
        <span className="tabular-nums text-sm min-w-[4.5rem] text-right">
          {totalRounds === 0 ? "0/0" : `${Math.min(round, maxRound) + 1}/${totalRounds}`}
        </span>
      </div>
    </div>
  );
}