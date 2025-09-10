"use client";

import { useMemo, useRef, useEffect } from "react";
import "shepherd.js/dist/css/shepherd.css";
import type { RaceData } from "@/lib/barRace";
import type { Playback, GameDisplay } from "@/lib/types";
import type { StepTemplate } from "@/lib/tour/types";
import { niceModelName } from "@/lib/model-metadata";
import { eventToSteps, type StepsContext } from "@/lib/tour/eventToSteps";
import { computeEvents, selectEvent } from "@/lib/highlights";
import { useShepherdTour } from "@/hooks/useTour";
import { offset } from "@floating-ui/dom";
import type { Tour, TourOptions } from "shepherd.js";

export const Anchors = {
  playButton: "play-button",
  barRace: "bar-race",
  explainerMove: "explainer-move",
  explainerTokens: "explainer-tokens",
  gameRules: "game-rules",
  todaysGame: "todays-game",
  barForModel: (id: string) => `model-${id}`,
};

export function TourAnchor({ anchor, className, children }: { anchor: string; className?: string; children: React.ReactNode; }) {
  return <div data-tour={anchor} className={className ?? ""}>{children}</div>;
}

export function anchorSelector(anchor: string) {
  return `[data-tour="${anchor}"]`;
}
/// Use as { ...anchorToProps(anchor) } when using the Anchor component is not possible
export function anchorToProps(anchor: string) {
  return { "data-tour": anchor };
}

type TourControllerProps = {
  raceData: RaceData | null;
  playback: Playback;
  setPlayback: (next: Playback | ((prev: Playback) => Playback)) => void;
  setFocusedModelId: (id: string | null) => void;
  game?: GameDisplay;
};

const tourOptions: TourOptions = {
  useModalOverlay: true,
  defaultStepOptions: {
    cancelIcon: { enabled: false },
    scrollTo: false,
    canClickTarget: true,
    modalOverlayOpeningPadding: 6,
    floatingUIOptions: {
      middleware: [offset({ mainAxis: 20, crossAxis: 0 })],
    },
  },
};

export function useOnboardingTour({ raceData, playback, setPlayback, setFocusedModelId, game }: TourControllerProps): Tour | null {
  const currentStepAdvanceRef = useRef<{ round: number; } | null>(null);

  function clearEmphasis() {
    document.querySelectorAll(".tour-emph").forEach((n) => n.classList.remove("tour-emph"));
  }

  function emphasizeTopRanks(positives: boolean, maxCount = 5) {
    const container = document.querySelector(anchorSelector(Anchors.explainerTokens));
    if (!container) return;
    const rankAttr = positives ? "data-rank-positive" : "data-rank-negative";
    const nodes = Array.from(container.querySelectorAll<HTMLSpanElement>(`[${rankAttr}]`));
    nodes
      .filter((el) => {
        const v = parseInt(el.getAttribute(rankAttr) || "0", 10);
        return Number.isFinite(v) && v > 0 && v <= maxCount;
      })
      .forEach((el) => el.classList.add("tour-emph"));
  }

  const allEvents = useMemo(() => (raceData ? computeEvents(raceData) : []), [raceData]);
  const selected = useMemo(() => selectEvent(allEvents), [allEvents]);

  const steps = useMemo<StepTemplate[]>(() => {
    if (!raceData) return [];

    // 1) Per-game intro steps
    const introSteps: StepTemplate[] = game?.tourIntro?.steps?.map((s, idx) => ({
      id: `intro-${idx}`,
      attachTo: s.attachTo,
      text: s.text,
    })) ?? [];

    // 2) Generic explainer steps (independent of game, but using selected model if any)
    const modelId = selected?.modelId ?? raceData.finalists()[0];
    if (!modelId) throw new Error("Empty race");
    const roundEndGenericSteps = selected?.round ?? raceData?.roundsLength - 1 ?? 0;

    const generic: StepTemplate[] = [
      {
        id: "first-move",
        attachTo: { element: anchorSelector(Anchors.explainerMove), on: "top" },
        text: `This is <b>${niceModelName(modelId)}</b>'s first's attempt. Is it good?`,
        onShow: [
          () => setFocusedModelId(modelId),
          () => setPlayback((prev) => ({ ...prev, isPlaying: false, round: 0 }))
        ],
      },
      {
        id: "tokens-positive",
        attachTo: { element: anchorSelector(Anchors.explainerTokens), on: "top" },
        text: "Well, some tokens are made more likely by its move! They're shown in green.",
        onShow: [clearEmphasis, () => emphasizeTopRanks(true, 5)],
        onHide: [clearEmphasis],
      },
      {
        id: "tokens-negative",
        attachTo: { element: anchorSelector(Anchors.explainerTokens), on: "bottom" },
        text: "But other tokens are hurt by the move as well, and the model is more surprised to see them.",
        onShow: [clearEmphasis, () => emphasizeTopRanks(false, 5)],
        onHide: [clearEmphasis],
      },
      {
        id: "final-score",
        attachTo: { element: anchorSelector(Anchors.barForModel(modelId)), on: "top" },
        text: `This gives it a score of ${raceData.augmented[0][modelId].score.toFixed(1)}. But now, it has more attempts to improve its score!`,
        onShow: [() => setFocusedModelId(modelId)],
      },
      {
        id: "play-race",
        attachTo: { element: anchorSelector(Anchors.playButton), on: "top" },
        text: "Let's see how it does!",
      },
      {
        id: "watch-leaderboard",
        attachTo: { element: anchorSelector(Anchors.barRace), on: "top" },
        text: `How does ${niceModelName(modelId)} do? (I don't know, I'm just a tooltip...)`,
        onShow: [() => setPlayback((prev) => ({ ...prev, round: 0, isPlaying: true }))],
        onHide: [() => setPlayback((prev) => ({ ...prev, round: roundEndGenericSteps, isPlaying: false }))],
        advanceOn: { round: roundEndGenericSteps },
      },
    ];

    // 3) Event-specific micro-steps
    const stepsContext: StepsContext = {
      setPlayback,
      setFocusedModelId,
      clearEmphasis,
      emphasizeTopRanks,
    };
    const eventSteps: StepTemplate[] = selected ? eventToSteps(selected, stepsContext) : [];

    const allSteps: StepTemplate[] = [
      {
        id: "intro",
        attachTo: { element: anchorSelector(Anchors.todaysGame), on: "bottom" },
        text: `The Xent Labs Benchmark is composed of many games. Today's game is <i>${game?.name}</i>.`,
      },
      ...introSteps,
      ...generic,
      ...eventSteps,
      {
        id: "wrap",
        attachTo: { element: anchorSelector(Anchors.explainerTokens), on: "top" },
        text: "Wrapping up: these tokens reflect where moves help or hurt.",
      },
    ];

    // This is a bit of a hack to add the auto-advance logic to the steps
    // before they are passed to the useTour hook.
    return allSteps.map(s => ({
      ...s,
      onShow: [
        ...(s.onShow ?? []),
        () => {
          if (s.advanceOn && 'round' in s.advanceOn) {
            currentStepAdvanceRef.current = s.advanceOn;
          } else {
            currentStepAdvanceRef.current = null;
          }
        }
      ],
      onHide: [
        ...(s.onHide ?? []),
        () => {
          currentStepAdvanceRef.current = null;
        }
      ]
    }));
  }, [raceData, setPlayback, setFocusedModelId, selected, game]);

  const tour = useShepherdTour(tourOptions, steps);

  // Auto-advance when target round is reached
  useEffect(() => {
    if (!tour || !currentStepAdvanceRef.current) return;

    const targetRound = currentStepAdvanceRef.current.round;
    if (playback.round >= targetRound) {
      tour.next();
      currentStepAdvanceRef.current = null;
    }
  }, [playback.round, tour]);

  return tour;
}

function scrollIntoViewNicely(el: Element | null) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const pad = 80; // px
  const top = window.scrollY + rect.top - Math.max(0, (window.innerHeight - rect.height) / 2) + (rect.height < 200 ? -pad : 0);
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}