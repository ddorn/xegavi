import { useRef, useEffect, useCallback } from "react";
import Shepherd, { type Tour, type TourOptions } from "shepherd.js";
import { offset } from "@floating-ui/dom";
import "shepherd.js/dist/css/shepherd.css";

import type { RaceData } from "@/lib/barRace";
import type { Playback, GameDisplay } from "@/lib/types";
import type { Event, StepTemplate } from "@/lib/tour/types";
import { niceModelName } from "@/lib/model-metadata";
import { eventToSteps, type StepsContext } from "@/lib/tour/eventToSteps";
import { computeEvents, selectEvent } from "@/lib/highlights";
import { Anchors, anchorSelector } from "@/components/TourAnchor";
import { showKeyboardHints } from "../lib/utils";

type TourManagerProps = {
    raceData: RaceData | null;
    playback: Playback;
    setPlayback: (next: Playback | ((prev: Playback) => Playback)) => void;
    setFocusedModelId: (id: string | null) => void;
    game?: GameDisplay;
};

function scrollIntoViewNicely(el: Element | null) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pad = 80;
    const top = window.scrollY + rect.top - Math.max(0, (window.innerHeight - rect.height) / 2) + (rect.height < 200 ? -pad : 0);
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

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

const defaultTourOptions: TourOptions = {
    useModalOverlay: true,
    defaultStepOptions: {
        cancelIcon: { enabled: false },
        scrollTo: false,
        canClickTarget: true,

        modalOverlayOpeningPadding: 6,
        floatingUIOptions: { middleware: [offset({ mainAxis: 20 })] },
    },
};

function buildOnboardingSteps(
    raceData: RaceData,
    game: GameDisplay,
    setPlayback: (next: Playback | ((prev: Playback) => Playback)) => void,
    setFocusedModelId: (id: string | null) => void,
    currentStepAdvanceRef: React.MutableRefObject<{ round: number; } | null>
): StepTemplate[] {
    const allEvents = computeEvents(raceData);
    const selected = selectEvent(allEvents);
    const modelId = selected?.modelId ?? raceData.finalists()[0];
    if (!modelId) return [];

    const roundEndGenericSteps = selected?.round ?? raceData.roundsLength - 1;
    const stepsContext: StepsContext = { setPlayback, setFocusedModelId, clearEmphasis, emphasizeTopRanks };
    const eventSteps = selected ? eventToSteps(selected, stepsContext) : [];

    const pointerHint = showKeyboardHints() ? "<br/><small>Use ← and → on your keyboard to navigate.</small>" : "";

    const steps: StepTemplate[] = [
        { id: "intro", attachTo: { element: anchorSelector(Anchors.todaysGame), on: "bottom" }, text: `The Xent Labs Benchmark is composed of many games. Today's game is <i>${game.name}</i>.${pointerHint}` },
        ...(game.tourIntro ?? []),
        { id: "first-move", attachTo: { element: anchorSelector(Anchors.explainerMove), on: "top" }, text: `This is <b>${niceModelName(modelId)}</b>'s first's attempt. Is it good?`, onShow: [() => setFocusedModelId(modelId), () => setPlayback(p => ({ ...p, isPlaying: false, round: 0 }))] },
        { id: "tokens-positive", attachTo: { element: anchorSelector(Anchors.explainerTokens), on: "top" }, text: "Well, some tokens are made more likely by its move! They're shown in green.", onShow: [clearEmphasis, () => emphasizeTopRanks(true, 5)], onHide: [clearEmphasis] },
        { id: "tokens-negative", attachTo: { element: anchorSelector(Anchors.explainerTokens), on: "bottom" }, text: "But other tokens are hurt by the move as well, and the model is more surprised to see them.", onShow: [clearEmphasis, () => emphasizeTopRanks(false, 5)], onHide: [clearEmphasis] },
        { id: "final-score", attachTo: { element: anchorSelector(Anchors.barForModel(modelId)), on: "top" }, text: `This gives it a score of ${raceData.augmented[0][modelId].score.toFixed(1)}. But now, it has more attempts to improve its score!`, onShow: [() => setFocusedModelId(modelId)] },
        { id: "play-race", attachTo: { element: anchorSelector(Anchors.playButton), on: "top" }, text: "Let's see how it does!" },
        { id: "watch-leaderboard", attachTo: { element: anchorSelector(Anchors.barRace), on: "top" }, text: `How does ${niceModelName(modelId)} do? (I don't know, I'm just a tooltip...)`, onShow: [() => setPlayback(p => ({ ...p, round: 0, isPlaying: true }))], onHide: [() => setPlayback(p => ({ ...p, round: roundEndGenericSteps, isPlaying: false }))], advanceOn: { round: roundEndGenericSteps } },
        ...eventSteps,
        { id: "wrap", attachTo: { element: anchorSelector(Anchors.explainerTokens), on: "top" }, text: "This is much greener now. Well done?" },
    ];

    return steps.map(s => ({
        ...s,
        onShow: [...(s.onShow || []), () => { if (s.advanceOn && 'round' in s.advanceOn) { currentStepAdvanceRef.current = s.advanceOn; } else { currentStepAdvanceRef.current = null; } }],
        onHide: [...(s.onHide || []), () => { currentStepAdvanceRef.current = null; }]
    }));
}


export function useTourManager({ raceData, playback, setPlayback, setFocusedModelId, game }: TourManagerProps) {
    const tourRef = useRef<Tour | null>(null);
    const currentStepAdvanceRef = useRef<{ round: number; } | null>(null);

    const onTourEnd = useCallback(() => {
        tourRef.current = null;
    }, []);

    const createTour = useCallback((tourOptions: TourOptions, steps: StepTemplate[]) => {
        if (tourRef.current && tourRef.current.isActive()) {
            tourRef.current.complete();
        }
        tourRef.current = null;

        if (steps.length === 0) return null;

        const tour = new Shepherd.Tour(tourOptions);
        tourRef.current = tour;

        tour.on("complete", onTourEnd);
        tour.on("cancel", onTourEnd);

        const previousButton = { text: "Prev", action: tour.back };
        const nextButton = { text: "Next", action: tour.next };
        const cancelButton = { text: "Esc", action: tour.cancel, classes: "shepherd-button-cancel" };

        steps.forEach(s => {
            tour.addStep({
                id: s.id,
                text: s.text,
                attachTo: s.attachTo,
                buttons: [cancelButton, previousButton, nextButton],
                advanceOn: s.advanceOn && 'selector' in s.advanceOn ? s.advanceOn : undefined,
                when: {
                    show: () => {
                        s.onShow?.forEach(fn => fn());
                        const anchor = typeof s.attachTo.element === 'string' ? document.querySelector(s.attachTo.element) : s.attachTo.element;
                        scrollIntoViewNicely(anchor);
                    },
                    hide: () => s.onHide?.forEach(fn => fn()),
                },
            });
        });
        return tour;
    }, [onTourEnd]);

    // Auto-advance for onboarding tour
    useEffect(() => {
        if (!tourRef.current || !currentStepAdvanceRef.current) return;
        const targetRound = currentStepAdvanceRef.current.round;
        if (playback.round >= targetRound) {
            tourRef.current.next();
            currentStepAdvanceRef.current = null;
        }
    }, [playback.round]);

    const startHighlightTour = useCallback((highlight: Event) => {
        const stepsContext: StepsContext = { setPlayback, setFocusedModelId, clearEmphasis, emphasizeTopRanks };
        const highlightSteps = eventToSteps(highlight, stepsContext, true).map(s => ({
            ...s,
            onShow: [...(s.onShow || []), () => { if (s.advanceOn && 'round' in s.advanceOn) { currentStepAdvanceRef.current = s.advanceOn; } else { currentStepAdvanceRef.current = null; } }],
            onHide: [...(s.onHide || []), () => { currentStepAdvanceRef.current = null; }]
        }));

        const tour = createTour(defaultTourOptions, highlightSteps);

        if (tour) {
            tour.start();
        }
    }, [createTour, setPlayback, setFocusedModelId]);

    const startOnboardingTour = useCallback(() => {
        if (!raceData || !game) return;

        const steps = buildOnboardingSteps(raceData, game, setPlayback, setFocusedModelId, currentStepAdvanceRef);
        const tour = createTour(defaultTourOptions, steps);

        if (tour) {
            tour.start();
        }
    }, [raceData, game, setPlayback, setFocusedModelId, createTour]);

    return { startOnboardingTour, startHighlightTour };
}
