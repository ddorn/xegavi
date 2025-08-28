"use client";

import React from "react";
import type { Playback } from "@/lib/types";
import { Slider } from "@/components/Slider";
import { CycleButton } from "@/components/CycleButton";

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
      <CycleButton
        value={(playback.speed as typeof SPEED_STEPS[number]) ?? 1}
        steps={SPEED_STEPS}
        onChange={(next) => onPlaybackChange({ ...playback, speed: next })}
        className="button"
        ariaLabel="Change speed"
        format={(v) => `${v}x`}
      />
      <div className="flex-1 flex items-center gap-2">
        <Slider
          min={0}
          max={maxRound}
          step={1}
          value={playback.round}
          onValueChange={(v) => onPlaybackChange({ ...playback, round: v })}
          aria-label="Round"
        />
        <span className="tabular-nums text-sm min-w-[4.5rem] text-right">
          {`${playback.round + 1}/${totalRounds}`}
        </span>
      </div>
    </div>
  );
}