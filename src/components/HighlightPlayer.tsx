"use client";

import { useEffect, useMemo } from "react";
import { offset } from "@floating-ui/dom";
import type { Playback } from "@/lib/types";
import { eventToSteps, type StepsContext } from "@/lib/tour/eventToSteps";
import type { Event } from "@/lib/tour/types";
import { useShepherdTour } from "@/hooks/useTour";
import type { TourOptions } from "shepherd.js";

export type HighlightPlayerProps = {
    highlight: Event | null;
    onDone: () => void;
    setPlayback: (next: Playback | ((prev: Playback) => Playback)) => void;
    setFocusedModelId: (id: string | null) => void;
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

export default function HighlightPlayer({ highlight, onDone, setPlayback, setFocusedModelId }: HighlightPlayerProps) {
    const steps = useMemo(() => {
        if (!highlight) return [];

        const stepsContext: StepsContext = {
            setPlayback,
            setFocusedModelId,
            clearEmphasis: () => {}, // No emphasis needed for highlights
            emphasizeTopRanks: () => {},
        };

        const highlightSteps = eventToSteps(highlight, stepsContext);
        if (highlightSteps.length === 0) {
            onDone();
            return [];
        }

        // Add side-effects to the steps
        return highlightSteps.map(step => ({
            ...step,
            onShow: [
                () => setPlayback((p) => ({ ...p, isPlaying: false, round: highlight.round })),
                ...(step.onShow || []),
            ]
        }));
    }, [highlight, setPlayback, setFocusedModelId, onDone]);

    const tour = useShepherdTour(tourOptions, steps);

    useEffect(() => {
        if (!tour) return;

        tour.on("complete", onDone);
        tour.on("cancel", onDone);

        tour.start();

        return () => {
            // cleanup listeners
            if (tour.isActive()) {
                tour.complete();
            }
        };
    }, [tour, onDone]);

    return null;
}
