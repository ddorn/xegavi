"use client";

import { useEffect, useMemo, useRef } from "react";
import Shepherd from "shepherd.js";
// import "shepherd.js/dist/css/shepherd.css";
import type { RaceData } from "@/lib/barRace";
import type { Playback } from "@/lib/types";

export type TourGuideProps = {
  raceData: RaceData | null;
  playback: Playback;
  setPlayback: (next: Playback) => void;
  focusedModelId: string | null;
  setFocusedModelId: (id: string | null) => void;
  autoStart?: boolean;
  targetNiceName?: string; // e.g. "Opus 4.1"
};

export default function TourGuide({
  raceData,
  playback,
  setPlayback,
  focusedModelId,
  setFocusedModelId,
  autoStart = false,
  targetNiceName = "Opus 4.1",
}: TourGuideProps) {
  const shepherdRef = useRef<any>(null);

  const targetId = useMemo(() => {
    if (!raceData) return null;
    const ids = raceData.finalists();
    for (const id of ids) {
      const round0 = raceData.roundsFor(id)?.[0];
      if (round0?.nice_model?.includes(targetNiceName)) return id;
    }
    return ids[0] ?? null;
  }, [raceData, targetNiceName]);

  // Observe round and pause at 19 after user presses Play
  useEffect(() => {
    if (!shepherdRef.current) return;
    const tour = shepherdRef.current;
    const desiredRound = 18; // 0-based index for Attempt 19

    if (tour.getCurrentStep()?.id === "watch-race") {
      if (playback.isPlaying && playback.round >= desiredRound) {
        setPlayback({ ...playback, isPlaying: false, round: desiredRound });
        setTimeout(() => tour.next(), 200);
      }
    }
  }, [playback, setPlayback]);

  // Initialize tour once
  useEffect(() => {
    if (!raceData || shepherdRef.current) return;

    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        scrollTo: false,
        canClickTarget: true,
        modalOverlayOpeningPadding: 6,
      },
    });
    shepherdRef.current = tour;

    const setRound = (r: number) => setPlayback({ ...playback, round: r, isPlaying: false });
    const selectTarget = () => {
      if (targetId) setFocusedModelId(targetId);
    };

    tour.addStep({
      id: "setup",
      text: "Setup: Opus 4.1 selected, round 1, paused.",
      buttons: [{ text: "Next", action: tour.next }],
      when: { show: () => { selectTarget(); setRound(0); } },
    });

    tour.addStep({
      id: "todays-game",
      text: "The Xent Labs benchmark is made of many games. Today is one of the simplest, Condense.",
      attachTo: { element: '[data-tour="todays-game"]', on: "bottom" },
      buttons: [{ text: "Next", action: tour.next }],
    });

    tour.addStep({
      id: "task",
      text: "LLMs will compete to condense this text in a maximally informative prefix for Qwen 14B.",
      attachTo: { element: '[data-tour="explainer-move"]', on: "top" },
      buttons: [{ text: "Next", action: tour.next }],
    });

    tour.addStep({
      id: "first-score",
      text: "Opus 4.1\'s first attempt isn\'t great, it scores only 10 points. Let\'s see where it is.",
      attachTo: { element: '[data-bar-name="Opus 4.1"]', on: "right" },
      buttons: [{ text: "Next", action: tour.next }],
    });

    tour.addStep({
      id: "that-move",
      text: "That\'s Opus 4.1\'s move.",
      attachTo: { element: '[data-tour="explainer-move"]', on: "top" },
      buttons: [{ text: "Next", action: tour.next }],
    });

    tour.addStep({
      id: "positives",
      text: 'Most of its points come from making " factory" more likely, but also " the end", " overseeing" and " AI".',
      attachTo: { element: '[data-tour="explainer-tokens"] .token-positive', on: "top" },
      buttons: [{ text: "Next", action: tour.next }],
    });

    tour.addStep({
      id: "negatives",
      text: "But its prefix made a lot of tokens less likely!",
      attachTo: { element: '[data-tour="explainer-tokens"] .token-negative', on: "bottom" },
      buttons: [{ text: "Next", action: tour.next }],
    });

    tour.addStep({
      id: "play",
      text: "Let\'s see how it improves its guesses. Click Play.",
      attachTo: { element: '[data-tour="play-button"]', on: "right" },
      advanceOn: { selector: '[data-tour="play-button"]', event: 'click' },
      buttons: [],
    });

    tour.addStep({
      id: "watch-race",
      text: "Watch the leaderboard until it reaches the top.",
      attachTo: { element: '[data-tour="bar-race"]', on: "left" },
      buttons: [],
    });

    tour.addStep({
      id: "wrap",
      text: "Now, most tokens are more likely.",
      attachTo: { element: '[data-tour="explainer-tokens"]', on: "top" },
      buttons: [{ text: "Finish", action: tour.complete }],
    });

    if (autoStart) tour.start();
  }, [raceData, playback, setPlayback, focusedModelId, setFocusedModelId, targetId, autoStart, targetNiceName]);

  // Start tour whenever autoStart toggles to true
  useEffect(() => {
    if (shepherdRef.current && autoStart) {
      shepherdRef.current.start();
    }
  }, [autoStart]);

  return null;
}