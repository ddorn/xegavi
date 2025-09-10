"use client";

import React, { useEffect, useCallback } from "react";
import type { Playback } from "@/lib/types";
import { Slider } from "@/components/Slider";
import { CycleButton } from "@/components/CycleButton";
import { TourAnchor, Anchors } from "./TourGuide";

export interface BarRaceControlsProps {
  playback: Playback;
  totalRounds: number;
  onPlaybackChange: (playback: Playback | ((prev: Playback) => Playback)) => void;
}

export function usePlayback(
  totalRounds: number,
  initialPlayback?: Partial<Playback>
): {
  playback: Playback;
  setPlayback: (playback: Playback | ((prev: Playback) => Playback)) => void;
} {
  const [playback, setPlaybackState] = React.useState<Playback>(() => ({
    isPlaying: true,
    round: 0,
    speed: 1,
    ...initialPlayback,
  }));

  const setPlayback = useCallback((playback: Playback | ((prev: Playback) => Playback)) => {
    setPlaybackState(playback);
  }, []);

  // Auto-advance rounds when playing
  useEffect(() => {
    if (!playback.isPlaying || totalRounds === 0) return;

    const stepDurationMs = Math.max(1, Math.round(1000 / (playback.speed || 1)) * 0.7);
    const id = setInterval(() => {
      setPlaybackState(prev => ({ ...prev, round: (prev.round + 1) % Math.max(1, totalRounds) }));
    }, stepDurationMs);

    return () => clearInterval(id);
  }, [playback.isPlaying, playback.speed, totalRounds]);

  return { playback, setPlayback };
}

export function BarRaceControls({
  playback,
  totalRounds,
  onPlaybackChange,
}: BarRaceControlsProps) {
  const SPEED_STEPS = [2, 1.5, 1, 0.5, 0.25] as const;
  const maxRound = Math.max(0, totalRounds - 1);

  return (
    <div className="flex items-center gap-2">
      <TourAnchor anchor={Anchors.playButton}>
        <button
          type="button"
          className="button"
          onClick={() => onPlaybackChange({ ...playback, isPlaying: !playback.isPlaying })}
          aria-label={playback.isPlaying ? "Pause" : "Play"}
        >
          {playback.isPlaying ? "Pause" : "Play"}
        </button>

      </TourAnchor>
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
        <span className="tabular-nums text-sm min-w-[6.5rem] text-right">
          {`Attempt ${playback.round + 1}/${totalRounds}`}
        </span>
      </div>
    </div>
  );
}