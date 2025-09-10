import type { Playback } from "@/lib/types";
import type { Event, StepTemplate } from "./types";
import { Anchors, anchorSelector } from "@/components/TourGuide";
import { niceModelName } from "../model-metadata";
import { numberToEnglishOrdinal } from "../utils";

export type StepsContext = {
  setPlayback: (next: Playback | ((prev: Playback) => Playback)) => void;
  setFocusedModelId: (id: string | null) => void;
  clearEmphasis: () => void;
  emphasizeTopRanks: (isPositive: boolean, maxCount?: number) => void;
};


export function eventToSteps(event: Event, context: StepsContext): StepTemplate[] {
  const { setPlayback, setFocusedModelId, clearEmphasis, emphasizeTopRanks } = context;
  const modelName = niceModelName(event.modelId);

  if (event.type === "first_to_top") {
    const rank = event.details.startRank + 1;
    const rankEnglish = numberToEnglishOrdinal(rank);
    return [
      {
        id: "first-to-top",
        attachTo: { element: anchorSelector(Anchors.barRace), on: "top" },
        text: `It's a new #1! Well done for ${modelName} who started ${rankEnglish}!`,
        onShow: [() => setPlayback((prev) => ({ ...prev, isPlaying: false, round: event.round }))],
      },
    ];
  } else if (event.type === "big_jump") {
    return [
      {
        id: "jump-bar",
        attachTo: { element: anchorSelector(Anchors.barForModel(event.modelId)), on: "right" },
        text: `Wow that was a big jump! ${modelName} improved by ${event.details.delta.toFixed(1)} bits.`,
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
        text: `${modelName} just passed ${niceModelName(event.details.previousLeaderId)} to lead by ${event.details.margin.toFixed(1)} bits!`,
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
