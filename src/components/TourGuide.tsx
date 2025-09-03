"use client";

import { useEffect, useMemo, useRef } from "react";
import Shepherd, { type Tour } from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";
import { offset, shift } from "@floating-ui/dom";
import type { RaceData } from "@/lib/barRace";
import type { Playback } from "@/lib/types";

export type TourGuideProps = {
  raceData: RaceData | null;
  playback: Playback;
  setPlayback: (next: Playback) => void;
  focusedModelId: string | null;
  setFocusedModelId: (id: string | null) => void;
  startSignal: number; // increment to (re)start the tour
  targetId?: string; // e.g. "Opus 4.1"
};

export default function TourGuide({
  raceData,
  playback,
  setPlayback,
  focusedModelId,
  setFocusedModelId,
  startSignal,
  targetId = "claude-opus-4-1-20250805",
}: TourGuideProps) {
  const shepherdRef = useRef<Tour | null>(null);


  // Helper: smooth scroll an element into view with padding
  function scrollIntoViewNicely(el: Element | null) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pad = 80; // px
    const top = window.scrollY + rect.top - Math.max(0, (window.innerHeight - rect.height) / 2) + (rect.height < 200 ? -pad : 0);
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  function clearEmphasis() {
    document.querySelectorAll(".tour-emph").forEach((n) => n.classList.remove("tour-emph"));
  }

  function emphasizeTopRanks(rankAttr: "data-rank-positive" | "data-rank-negative", maxCount = 5) {
    const container = document.querySelector('[data-tour="explainer-tokens"]');
    if (!container) return;
    const nodes = Array.from(container.querySelectorAll<HTMLSpanElement>(`[${rankAttr}]`));
    nodes
      .filter((el) => {
        const v = parseInt(el.getAttribute(rankAttr) || "0", 10);
        return Number.isFinite(v) && v > 0 && v <= maxCount;
      })
      .forEach((el) => el.classList.add("tour-emph"));
  }

  // Observe round and pause at 19 after user presses Play
  useEffect(() => {
    if (!shepherdRef.current) return;
    const tour = shepherdRef.current;
    const desiredRound = 18; // 0-based index for Attempt 19

    if (tour.getCurrentStep()?.id === "watch-race") {
      if (playback.isPlaying && playback.round >= desiredRound) {
        setPlayback({ ...playback, isPlaying: false, round: desiredRound });
        setTimeout(() => tour.next(), 150);
      }
    }
  }, [playback, setPlayback]);

  // Initialize tour once
  useEffect(() => {
    if (!raceData || shepherdRef.current) return;

    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: { enabled: false },
        scrollTo: false,
        canClickTarget: true,
        modalOverlayOpeningPadding: 6,
        floatingUIOptions: {
          middleware: [
            offset({mainAxis: 20, crossAxis: 0})
          ]
        }
      },
    });

    shepherdRef.current = tour;

    const setRound = (r: number) => setPlayback({ ...playback, round: r, isPlaying: false });

    tour.addStep({
      id: "todays-game",
      text: "The Xent Labs benchmark is made of many games. Today is one of the simplest, Condense.",
      attachTo: { element: '[data-tour="todays-game"]', on: "bottom" },
      buttons: [{ text: "Next", action: tour.next }],
      when: {
        show: () => {
          setFocusedModelId(targetId);
          setRound(0);
          const el = document.querySelector('[data-tour="todays-game"]');
          scrollIntoViewNicely(el);
        },
      },
    });

    tour.addStep({
      id: "task",
      text: "LLMs will compete to condense this text in a maximally informative prefix for Qwen 14B.",
      attachTo: { element: '[data-tour="explainer-move"]', on: "top" },
      buttons: [{ text: "Next", action: tour.next }],
      when: { show: () => scrollIntoViewNicely(document.querySelector('[data-tour="explainer-move"]')) },
    });

    tour.addStep({
      id: "first-score",
      text: "Opus 4.1\'s first attempt isn\'t great, it scores only 10 points. Let\'s see where it is.",
      attachTo: { element: '[data-bar-name="Opus 4.1"]', on: "right" },
      buttons: [{ text: "Next", action: tour.next }],
      when: { show: () => scrollIntoViewNicely(document.querySelector('[data-bar-name="Opus 4.1"]')) },
    });

    tour.addStep({
      id: "that-move",
      text: "That\'s Opus 4.1\'s move.",
      attachTo: { element: '[data-tour="explainer-move"]', on: "top" },
      buttons: [{ text: "Next", action: tour.next }],
      when: { show: () => scrollIntoViewNicely(document.querySelector('[data-tour="explainer-move"]')) },
    });

    tour.addStep({
      id: "positives",
      text: 'Most of its points come from making " factory" more likely, but also " the end", " overseeing" and " AI".',
      attachTo: { element: '[data-tour="explainer-tokens"]', on: "top" },
      buttons: [{ text: "Next", action: tour.next }],
      when: {
        show: () => {
          clearEmphasis();
          emphasizeTopRanks("data-rank-positive", 5);
          scrollIntoViewNicely(document.querySelector('[data-tour="explainer-tokens"]'));
        },
        hide: () => clearEmphasis(),
      },
    });

    tour.addStep({
      id: "negatives",
      text: "But its prefix made a lot of tokens less likely!",
      attachTo: { element: '[data-tour="explainer-tokens"]', on: "bottom" },
      buttons: [{ text: "Next", action: tour.next }],
      when: {
        show: () => {
          clearEmphasis();
          emphasizeTopRanks("data-rank-negative", 5);
          scrollIntoViewNicely(document.querySelector('[data-tour="explainer-tokens"]'));
        },
        hide: () => clearEmphasis(),
      },
    });

    tour.addStep({
      id: "play",
      text: "Let\'s see how it improves its guesses. Click Play.",
      attachTo: { element: '[data-tour="play-button"]', on: "right" },
      advanceOn: { selector: '[data-tour="play-button"]', event: 'click' },
      buttons: [],
      when: { show: () => scrollIntoViewNicely(document.querySelector('[data-tour="play-button"]')) },
    });

    tour.addStep({
      id: "watch-race",
      text: "Watch the leaderboard until it reaches the top.",
      attachTo: { element: '[data-tour="bar-race"]', on: "left" },
      when: {
        show: () => {
          // Ensure it is actually playing even if advanced with keyboard
          setPlayback({ ...playback, isPlaying: true });
          scrollIntoViewNicely(document.querySelector('[data-tour="bar-race"]'));
        },
      },
      buttons: [],
    });

    tour.addStep({
      id: "wrap",
      text: "Now, most tokens are more likely.",
      attachTo: { element: '[data-tour="explainer-tokens"]', on: "top" },
      buttons: [{ text: "Finish", action: tour.next }],
      when: {
        show: () => {
          // Ensure the final state is on attempt 19 for the target model
          if (targetId) setFocusedModelId(targetId);
          setPlayback({ ...playback, isPlaying: false, round: 18 });
          scrollIntoViewNicely(document.querySelector('[data-tour="explainer-tokens"]'));
        },
      },
    });
  }, [raceData, playback, setPlayback, focusedModelId, setFocusedModelId, targetId, targetId]);

  // Start tour whenever the counter increments
  useEffect(() => {
    if (!shepherdRef.current) return;
    if (startSignal > 0) {
      shepherdRef.current.start();
    }
  }, [startSignal]);

  return null;
}