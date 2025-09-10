
import { useMemo } from "react";
import Shepherd, { type Tour, type TourOptions } from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";
import { offset } from "@floating-ui/dom";
import type { StepTemplate } from "@/lib/tour/types";

export function useShepherdTour(tourOptions: TourOptions, steps: StepTemplate[]): Tour | null {
    const tour = useMemo(() => {
        if (!steps || steps.length === 0) return null;

        const tourInstance = new Shepherd.Tour(tourOptions);

        const previousButton = { text: "Prev", action: tourInstance.back };
        const nextButton = { text: "Next", action: tourInstance.next };
        const cancelButton = { text: "Esc", action: tourInstance.cancel, classes: "shepherd-button-cancel" };

        for (const s of steps) {
            tourInstance.addStep({
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
                    hide: () => {
                        s.onHide?.forEach(fn => fn());
                    },
                },
            });
        }
        return tourInstance;
    }, [tourOptions, steps]);

    return tour;
}

function scrollIntoViewNicely(el: Element | null) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pad = 80; // px
    const top = window.scrollY + rect.top - Math.max(0, (window.innerHeight - rect.height) / 2) + (rect.height < 200 ? -pad : 0);
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}
