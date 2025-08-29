"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export type CoachmarkProps = {
  show: boolean;
  angle: number; // degrees; 0 = right, 90 = up, 180 = left, 270 = down
  distance: number; // px from target center to label anchor point
  label: React.ReactNode; // styled externally
  color?: string; // arrow color; default green
  children: React.ReactNode; // wrapped target
};

export function Coachmark({ show, angle, distance, label, color = "#22c55e", children }: CoachmarkProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);

  const [wrapperSize, setWrapperSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [labelSize, setLabelSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Measure wrapper and label once mounted; keep simple but responsive to resizes
  useLayoutEffect(() => {
    const wrapperEl = wrapperRef.current;
    if (!wrapperEl) return;
    const measure = () => {
      const rect = wrapperEl.getBoundingClientRect();
      setWrapperSize({ width: rect.width, height: rect.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrapperEl);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = labelRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setLabelSize({ width: rect.width, height: rect.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [label]);

  // Tail at target center (screen coords: y downward)
  const tail = useMemo(() => {
    const cx = wrapperSize.width / 2;
    const cy = wrapperSize.height / 2;
    return { x: cx, y: cy };
  }, [wrapperSize.width, wrapperSize.height]);

  // Direction vector: 0deg=+x, 90deg=up (negative y in screen space)
  const radians = (angle * Math.PI) / 180;
  const ux = Math.cos(radians);
  const uy = -Math.sin(radians);

  // Label anchor point in wrapper coordinates (polar placement)
  const anchor = useMemo(() => {
    return { x: tail.x + distance * ux, y: tail.y + distance * uy };
  }, [tail.x, tail.y, distance, ux, uy]);

  // Decide which label edge to anchor: always horizontal
  const anchorOnLeftEdge = ux >= 0; // if pointing to the right, hit label's left edge; else right edge

  // Compute label top-left position so that the chosen edge middle equals anchor
  const labelPosition = useMemo(() => {
    const halfH = labelSize.height / 2;
    if (anchorOnLeftEdge) {
      return { left: anchor.x, top: anchor.y - halfH };
    } else {
      return { left: anchor.x - labelSize.width, top: anchor.y - halfH };
    }
  }, [anchor.x, anchor.y, anchorOnLeftEdge, labelSize.height, labelSize.width]);

  // Component edge point along the given direction (ray-rectangle intersection)
  const edge = useMemo(() => {
    const cx = tail.x;
    const cy = tail.y;
    const w = wrapperSize.width;
    const h = wrapperSize.height;

    let tx = Number.POSITIVE_INFINITY;
    let ty = Number.POSITIVE_INFINITY;

    if (ux !== 0) {
      const xBound = ux > 0 ? w : 0;
      tx = (xBound - cx) / ux;
    }
    if (uy !== 0) {
      const yBound = uy > 0 ? h : 0;
      ty = (yBound - cy) / uy;
    }

    const tCandidateX = tx > 0 ? tx : Number.POSITIVE_INFINITY;
    const tCandidateY = ty > 0 ? ty : Number.POSITIVE_INFINITY;
    const t = Math.min(tCandidateX, tCandidateY);

    const ex = cx + ux * t;
    const ey = cy + uy * t;
    return { x: ex, y: ey };
  }, [tail.x, tail.y, wrapperSize.width, wrapperSize.height, ux, uy]);

  // Bezier control points: start at label edge, end at component edge (arrowhead)
  const k1 = 0.38;
  const k2 = 0.38;
  const p0 = useMemo(() => ({ x: anchor.x, y: anchor.y }), [anchor.x, anchor.y]);
  const p3 = useMemo(() => ({ x: edge.x, y: edge.y }), [edge.x, edge.y]);
  const startDirX = anchorOnLeftEdge ? 1 : -1; // leave label horizontally toward component
  const p1 = useMemo(() => ({ x: p0.x + startDirX * distance * k2, y: p0.y }), [p0.x, p0.y, startDirX, distance]);
  const p2 = useMemo(() => ({ x: p3.x - ux * distance * k1, y: p3.y - uy * distance * k1 }), [p3.x, p3.y, ux, uy, distance]);

  const pathD = useMemo(() => {
    const m = `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)}`;
    const c = `C ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}, ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`;
    return `${m} ${c}`;
  }, [p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y]);

  const svgSize = wrapperSize;
  const markerId = useMemo(() => `coachmark-arrowhead-${Math.random().toString(36).slice(2)}`, []);

  return (
    <div ref={wrapperRef} style={{ position: "relative", display: "inline-block" }}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 30 }}
          >
            <motion.svg
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              width={svgSize.width}
              height={svgSize.height}
              viewBox={`0 0 ${Math.max(1, svgSize.width)} ${Math.max(1, svgSize.height)}`}
              style={{ position: "absolute", inset: 0, overflow: "visible" }}
            >
              <defs>
                <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="3.5" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L7,3.5 L0,7 Z" fill={color} />
                </marker>
              </defs>
              <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                markerEnd={`url(#${markerId})`}
              />
            </motion.svg>

            <motion.div
              ref={labelRef}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              style={{ position: "absolute", left: labelPosition.left, top: labelPosition.top }}
            >
              {label}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}