import type { Playback } from "@/lib/types";
import type { Event, StepTemplate } from "./types";
import { Anchors, anchorSelector } from "@/components/TourGuide";

export type StepsContext = {
  setPlayback: (next: Playback | ((prev: Playback) => Playback)) => void;
  setFocusedModelId: (id: string | null) => void;
  clearEmphasis: () => void;
  emphasizeTopRanks: (isPositive: boolean, maxCount?: number) => void;
};

export function eventToSteps(event: Event, context: StepsContext): StepTemplate[] {
  const { setPlayback, setFocusedModelId, clearEmphasis, emphasizeTopRanks } = context;

  if (event.type === "first_to_top") {
    return [
      {
        id: "watch-race",
        attachTo: { element: anchorSelector(Anchors.barRace), on: "top" },
        text: "Watch the leaderboard.",
        onShow: [
          () => setFocusedModelId(event.modelId),
          () => setPlayback((prev) => ({ ...prev, isPlaying: true }))
        ],
      },
      {
        id: "first-to-top",
        attachTo: { element: anchorSelector(Anchors.barRace), on: "top" },
        text: "This model reaches #1.",
        onShow: [() => setPlayback((prev) => ({ ...prev, isPlaying: false, round: event.round }))],
      },
    ];
  } else if (event.type === "big_jump") {
    return [
      {
        id: "jump-bar",
        attachTo: { element: anchorSelector(Anchors.barForModel(event.modelId)), on: "right" },
        text: "Large single-round improvement for this model.",
        onShow: [
          () => setFocusedModelId(event.modelId),
          () => setPlayback((prev) => ({ ...prev, isPlaying: false, round: event.round }))
        ],
      },
    ];
  } else if (event.type === "lead_change") {
    return [
      {
        id: "lead-play",
        attachTo: { element: anchorSelector(Anchors.playButton), on: "right" },
        text: "Press play to watch for the lead change.",
        advanceOn: { selector: Anchors.playButton, event: "click" },
        onShow: [() => setPlayback((prev) => ({ ...prev, isPlaying: true }))],
      },
      {
        id: "lead-at",
        attachTo: { element: anchorSelector(Anchors.barRace), on: "top" },
        text: "Lead changes here.",
        onShow: [() => setPlayback((prev) => ({ ...prev, isPlaying: false, round: event.round }))],
      },
    ];
  } else if (event.type === "max_token_positive" || event.type === "max_token_negative") {
    const isPositive = event.type === "max_token_positive";
    return [
      {
        id: "token-impact",
        attachTo: { element: anchorSelector(Anchors.explainerTokens), on: "top" },
        text: isPositive
          ? "This token saw the strongest positive impact."
          : "This token was hurt the most by the move.",
        onShow: [clearEmphasis, () => emphasizeTopRanks(isPositive, 1)],
        onHide: [clearEmphasis],
      },
    ];
  }

  return [];
}
