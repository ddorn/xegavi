"use client";

import { motion } from "motion/react";
import { pickTextColor } from "@/lib/colors";
import type { BarRaceItem } from "@/lib/barRace";
import { Anchors, anchorToProps } from "./TourAnchor";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Measure } from "./Measure";

type ComponentName = "name" | "description" | "score";

interface ComponentWidths {
    name: number;
    description: number;
    score: number;
}

interface SegmentWidths {
    left: number;
    inside: number;
    right: number;
}

interface Layout {
    left: ComponentName[];
    inside: ComponentName[];
    right: ComponentName[];
}

function distributeContent(componentWidths: ComponentWidths, segmentWidths: SegmentWidths, flipped: boolean): Layout {
    const { name, description, score } = componentWidths;
    const { left, inside, right } = segmentWidths;

    let outsideSize = flipped ? left : right;
    let insideSize = inside;
    let oppositeSize = flipped ? right : left;

    const insideSegment: ComponentName[] = ["description"];
    const outsideSegment: ComponentName[] = [];
    const oppositeSegment: ComponentName[] = [];


    // 1. Space outside? Add the score, otherwise inside.
    if (outsideSize > score) {
        outsideSegment.push("score");
        outsideSize -= score;
    } else {
        insideSegment.push("score");
        insideSize -= score;
    }

    // 2. Name priorities: 1. opposite if flipped, 2. inside, 3. outside, 4. inside
    if (flipped && oppositeSize > name) {
        oppositeSegment.push("name");
        oppositeSize -= name;
    } else if (insideSize > name) {
        insideSegment.push("name");
        insideSize -= name;
    } else if (outsideSize > name) {
        outsideSegment.push("name");
        outsideSize -= name;
    } else {
        outsideSegment.push("name");
        outsideSize -= name;
    }

    insideSegment.push("description");

    // Sort elements inside in this order: name, description, score
    const order = ["name", "description", "score"];
    insideSegment.sort((a, b) => order.indexOf(a) - order.indexOf(b));

    // Sort elements outside in this order: score, name, description
    const orderOutside = ["name", "score", "description"];
    outsideSegment.sort((a, b) => orderOutside.indexOf(a) - orderOutside.indexOf(b));

    if (flipped) {
        return { left: outsideSegment.reverse(), inside: insideSegment.reverse(), right: oppositeSegment.reverse() };
    } else {
        return { left: oppositeSegment, inside: insideSegment, right: outsideSegment };
    }



}


export interface BarProps {
    item: BarRaceItem;
    widthPct: number; // 0..100
    xZeroPct?: number;
    flipped?: boolean;
    barHeight: number;
    logo?: React.ReactNode;
    onClick?: () => void;
    transitionDurationSec?: number;
    textColorOverride?: string;
    solidBackground?: boolean; // when false, do not apply item.color background (used by full overlay mode)
    slots?: {
        prefix?: React.ReactNode; // placed between logo and bar fill, self-sized
        overlay?: React.ReactNode; // absolute overlay covering the bar fill
        footer?: React.ReactNode; // absolute bottom stripe inside the bar fill
    };
    displayDescription?: boolean;
    moveAlignment?: "left" | "right";
}

/**
 * Renders a single bar within the BarRace.
 * The colored bar rectangle is positioned absolutely with its base at `xZeroPct` and width `widthPct`.
 * `flipped` reverses the internal layout (score vs. name) for negative values.
 */
export function Bar({ item, widthPct, xZeroPct = 0, flipped = false, barHeight, logo, onClick, transitionDurationSec = 1, textColorOverride, solidBackground = true, slots, displayDescription = false, moveAlignment = "left" }: BarProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                setContainerWidth(entry.contentRect.width);
            }
        });

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const computedTextColor = textColorOverride ?? pickTextColor(item.color);
    const safeWidthPct = Math.max(0, Math.min(100, widthPct));

    const { leftSpacerPct, barAreaPct, rightSpacerPct } = useMemo(() => {
        const barAreaPct = safeWidthPct;
        if (flipped) {
            const leftSpacerPct = xZeroPct - barAreaPct;
            const rightSpacerPct = 100 - xZeroPct;
            return { leftSpacerPct, barAreaPct, rightSpacerPct };
        } else {
            const leftSpacerPct = xZeroPct;
            const rightSpacerPct = 100 - xZeroPct - barAreaPct;
            return { leftSpacerPct, barAreaPct, rightSpacerPct };
        }
    }, [safeWidthPct, xZeroPct, flipped]);

    const transition = { duration: transitionDurationSec, ease: "easeInOut" };

    const NameComponent = (
        <span className="font-black whitespace-nowrap px-2">{item.name}</span>
    );
    const DescriptionComponent = displayDescription ? (
        <span className="px-2 opacity-90 text-ellipsis whitespace-nowrap">{item.description}</span>
    ) : null;
    const ScoreComponent = (
        <span className="font-semibold whitespace-nowrap px-2">{item.value.toFixed(1)}</span>
    );

    const componentMap = {
        name: NameComponent,
        description: DescriptionComponent,
        score: ScoreComponent,
    };

    return (
        <div
            className="flex items-center gap-2 w-full"
            style={{ height: barHeight }}
            onClick={onClick}
            {...anchorToProps(Anchors.barForModel(item.id))}
        >
            {slots?.prefix}
            <div style={{ width: barHeight, height: barHeight }} className="shrink-0 flex items-center justify-center">
                {logo}
            </div>
            <div className="grow min-w-0 flex" style={{ height: barHeight }} ref={containerRef}>
                <Measure elements={[NameComponent, DescriptionComponent, ScoreComponent].filter(Boolean) as React.ReactElement[]}>
                    {(dims) => {

                        const [nameDim, descDim, scoreDim] = [
                            dims[0],
                            displayDescription ? dims[1] : { width: 0, height: 0 },
                            dims[displayDescription ? 2 : 1],
                        ];

                        const layout = distributeContent(
                            { name: nameDim.width, description: descDim.width, score: scoreDim.width },
                            {
                                left: containerWidth * (leftSpacerPct / 100),
                                inside: containerWidth * (barAreaPct / 100),
                                right: containerWidth * (rightSpacerPct / 100),
                            },
                            flipped,
                        );

                        return (
                            <>
                                <motion.div
                                    initial={{ width: flipped ? `${xZeroPct}%` : "0%" }}
                                    animate={{ width: `${leftSpacerPct}%` }}
                                    transition={transition}
                                    className="flex items-center justify-end"
                                    style={{ color: textColorOverride ?? "inherit" }}
                                >
                                    {layout.left.map((name) => componentMap[name])}
                                </motion.div>
                                <motion.div
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${barAreaPct}%` }}
                                    transition={transition}
                                    className="relative overflow-hidden flex items-center justify-between"
                                    style={{
                                        ...(solidBackground && { backgroundColor: item.color }),
                                        color: computedTextColor,
                                    }}
                                >
                                    {slots?.overlay}
                                    {layout.inside.map((name) => componentMap[name])}
                                    {slots?.footer}
                                </motion.div>
                                <motion.div
                                    initial={{ width: flipped ? `${100 - xZeroPct}%` : "100%" }}
                                    animate={{ width: `${rightSpacerPct}%` }}
                                    transition={transition}
                                    className="flex items-center justify-start"
                                    style={{ color: textColorOverride ?? "inherit" }}
                                >
                                    {layout.right.map((name) => componentMap[name])}
                                </motion.div>
                            </>
                        );
                    }}
                </Measure>
            </div>
        </div>
    );
}