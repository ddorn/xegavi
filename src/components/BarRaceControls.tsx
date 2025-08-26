"use client";

import React from "react";
import type { Playback } from "@/lib/types";

export interface BarRaceControlsProps {
  playback: Playback;
  maxRound: number;
  totalRounds: number;
  onPlaybackChange: (next: Playback) => void;
}

export function BarRaceControls({
  playback,
  maxRound,
  totalRounds,
  onPlaybackChange,
}: BarRaceControlsProps) {
  const SPEED_STEPS = [0.25, 0.5, 1, 1.5, 2] as const;
  const currentIndex = Math.max(0, SPEED_STEPS.indexOf((playback.speed as typeof SPEED_STEPS[number]) ?? 1));
  const cycle = () => onPlaybackChange({ ...playback, speed: SPEED_STEPS[(currentIndex + 1) % SPEED_STEPS.length] });
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        className="button"
        onClick={() => onPlaybackChange({ ...playback, isPlaying: !playback.isPlaying })}
        aria-label={playback.isPlaying ? "Pause" : "Play"}
      >
        {playback.isPlaying ? "Pause" : "Play"}
      </button>
      <button
        type="button"
        className="button"
        onClick={cycle}
        aria-label="Change speed"
      >
        {`${playback.speed}x`}
      </button>
      <div className="flex-1 flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={maxRound}
          step={1}
          value={Math.min(playback.round, maxRound)}
          onChange={(e) => onPlaybackChange({ ...playback, round: Number(e.target.value) })}
          className="w-full"
          aria-label="Round"
        />
        <span className="tabular-nums text-sm min-w-[4.5rem] text-right">
          {`${playback.round + 1}/${totalRounds}`}
        </span>
      </div>
    </div>
  );
}