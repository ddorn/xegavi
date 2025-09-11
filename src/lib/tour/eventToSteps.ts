import type { Playback } from "@/lib/types";
import type { Event, StepTemplate } from "./types";
import { Anchors, anchorSelector } from "@/components/TourAnchor";
import { niceModelName } from "../model-metadata";
import { numberToEnglishOrdinal } from "../utils";

export type StepsContext = {
  setPlayback: (next: Playback | ((prev: Playback) => Playback)) => void;
  setFocusedModelId: (id: string | null) => void;
  clearEmphasis: () => void;
  emphasizeTopRanks: (isPositive: boolean, maxCount?: number) => void;
};

export function filterSteps(steps: StepTemplate[], standalone: boolean): StepTemplate[] {
  return standalone ? steps : steps.filter(step => !step.id.startsWith("standalone:"));
}

export function eventToSteps(event: Event, context: StepsContext, standalone = false): StepTemplate[] {
  const { setPlayback, setFocusedModelId, clearEmphasis, emphasizeTopRanks } = context;
  const modelName = niceModelName(event.modelId);

  const focusModel = () => setFocusedModelId(event.modelId);
  const setRound = (round: number, state: "play" | "pause") =>
    () => setPlayback(prev => ({ ...prev, isPlaying: state === "play", round }));
  const emphasize = (isPositive: boolean, maxCount?: number) => () => emphasizeTopRanks(isPositive, maxCount);

  if (event.type === "first_to_top") {
    const rank = event.details.startRank + 1;
    const rankEnglish = numberToEnglishOrdinal(rank);
    const steps: StepTemplate[] = [
      {
        id: "standalone:first-to-top-pre",
        attachTo: { element: anchorSelector(Anchors.barForModel(event.modelId)), on: "top" },
        text: `At the start, ${modelName} was ${rankEnglish}. Let's see how it gets to the top.`,
        onShow: [setRound(0, "pause"), focusModel],
        advanceOn: { round: event.round },
      },
      {
        id: "standalone:first-to-top-watch",
        attachTo: { element: anchorSelector(Anchors.barRace), on: "top" },
        text: `👀`,
        onShow: [focusModel, setRound(0, "play")],
        advanceOn: { round: event.round },
      },
      {
        id: "first-to-top",
        attachTo: { element: anchorSelector(Anchors.barRace), on: "top" },
        text: `It's a new #1! Well done for ${modelName} who started ${rankEnglish}!`,
        onShow: [setRound(event.round, "pause"), focusModel],
      },
    ];
    return filterSteps(steps, standalone);
  } else if (event.type === "big_jump") {
    const steps: StepTemplate[] = [
      {
        id: "standalone:jump-bar-pre",
        attachTo: { element: anchorSelector(Anchors.barForModel(event.modelId)), on: "top" },
        text: `Watch ${modelName} closely...`,
        onShow: [focusModel, setRound(event.round - 1, "pause")],
        advanceOn: { round: event.round },
      },
      {
        id: "jump-bar",
        attachTo: { element: anchorSelector(Anchors.barRace), on: "top" },
        text: `Wow that was a big jump! ${modelName} improved by ${event.details.delta.toFixed(1)} bits.`,
        onShow: [focusModel, setRound(event.round, "pause")],
      },
    ];
    return filterSteps(steps, standalone);
  } else if (event.type === "lead_change") {
    const steps: StepTemplate[] = [
      {
        id: "standalone:lead-at-pre",
        attachTo: { element: anchorSelector(Anchors.barRace), on: "top" },
        text: `Here, ${niceModelName(event.details.previousLeaderId)} is in the lead. Watch what happens next...`,
        onShow: [setRound(event.round - 1, "pause"), focusModel],
        advanceOn: { round: event.round },
      },
      {
        id: "lead-at",
        attachTo: { element: anchorSelector(Anchors.barRace), on: "top" },
        text: `${modelName} just passed ${niceModelName(
          event.details.previousLeaderId,
        )} to lead by ${event.details.margin.toFixed(1)} bits!`,
        onShow: [setRound(event.round, "pause"), focusModel],
      },
    ];
    return filterSteps(steps, standalone);
  } else if (event.type === "max_token_positive" || event.type === "max_token_negative") {
    const isPositive = event.type === "max_token_positive";
    const steps: StepTemplate[] = [
      {
        id: "token-impact",
        attachTo: { element: anchorSelector(Anchors.explainerTokens), on: "top" },
        text: isPositive
          ? "This token saw the strongest positive impact."
          : "This token was hurt the most by the move.",
        onShow: [
          clearEmphasis,
          emphasize(isPositive, 1),
          focusModel,
          setRound(event.round, "pause"),
        ],
        onHide: [clearEmphasis],
      },
    ];
    return filterSteps(steps, standalone);
  }

  return [];
}
