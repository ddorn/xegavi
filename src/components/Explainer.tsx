"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { TokenScores } from "@/lib/types";
import { TokenScoresBox } from "@/components/TokenScoresBox";
import { TokenText } from "@/components/TokenText";
import { ProgressDots } from "@/components/ProgressDots";
import { useDataset } from "@/hooks/useDataset";

export interface ExplainerExample {
  prefix: string; // empty string indicates baseline
  tokenScores: TokenScores;
}

export interface ExplainerProps {
  examples?: ExplainerExample[];
  className?: string;
}

export function Explainer({ examples, className }: ExplainerProps) {
  const { data } = useDataset();

  // Build default examples from first model in first 3 rounds + baseline
  const defaultExamples: ExplainerExample[] = useMemo(() => {
    if (!data || !data.rounds.length) return [];
    const firstRounds = data.rounds.slice(0, 3);
    const modelName = firstRounds[0]?.[0]?.model;
    if (!modelName) return [];
    const rows = firstRounds.map((round) => round.find((r) => r.model === modelName)).filter(Boolean) as any[];
    const derived = rows.map((r) => ({ prefix: r.move, tokenScores: r.token_scores }));
    // Baseline is first item's tokenization but no prefix and no highlighting
    const baseline: ExplainerExample = { prefix: "", tokenScores: derived[0]?.tokenScores ?? [] };
    return [baseline, ...derived];
  }, [data]);

  const list = examples && examples.length ? examples : defaultExamples;
  const [idx, setIdx] = useState(0); // start on baseline
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  const current = list[idx] ?? null;

  // Auto-cycle every 8s, pause on hover, resume on leave
  useEffect(() => {
    if (paused || list.length <= 1) return;
    timerRef.current && window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setIdx((i) => (i + 1) % list.length);
    }, 8000);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [idx, paused, list.length]);

  if (!current) return null;

  const isBaseline = current.prefix.trim().length === 0;

  return (
    // <div className={className} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
    <div className={className}>
      <div>
        <div className="text-3xl font-semibold text-center mb-2">What prefix makes</div>

        <div className="flex items-center justify-center mb-2">
          <div className="max-w-150 text-center leading-7 text-lg">
            <span className="mr-1 bg-amber-100 text-neutral-700 rounded-md px-1.5 py-0.5 dark:bg-amber-900 dark:text-neutral-200 dark:border-amber-800">
              {isBaseline ? "PREFIX" : current.prefix}
            </span>
            {isBaseline ? (
              <TokenText tokenScores={current.tokenScores} className="inline align-baseline leading-7" />
            ) : (
              <TokenScoresBox tokenScores={current.tokenScores} className="inline align-baseline leading-7" />
            )}
          </div>
        </div>

        <div className="text-3xl font-semibold text-center mb-4">most likely?</div>
      </div>

      <ProgressDots count={list.length} activeIndex={idx} onSelect={(i) => setIdx(i)} className="mb-6" />

      <div className="flex gap-4">
        <div className="min-w-max">
          <div className="text-sm font-semibold mb-2">Rules</div>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 items-start p-3 rounded-md border">
            <div className="text-sm font-semibold opacity-80">1</div>
            <div className="text-sm">You cannot reuse words from the text.</div>
            <div className="text-sm font-semibold opacity-80">2</div>
            <div className="text-sm">The prefix can be up to 10 tokens (~7 words).</div>
            <div className="text-sm font-semibold opacity-80">3</div>
            <div className="text-sm">You have 32 attempts to make your top score.</div>
          </div>
        </div>

        <div>
          <div className="font-semibold mb-2">About this game</div>
          <div className="mb-2">
            This game is part of Xent Labs Benchmarks where LLMs compete to play in diverse text games of arbitrary difficulty.
            This one is not unlike summarization: models compete to minimise Qwen 14B's surprise when given
            the prefix and the continuation. If Qwen is less surprised, tokens are <span className="bg-green-600/60 rounded-xs px-0.5">green</span>
            , the prefix contains valuable information about the content of the text.
            If a token is <span className="bg-red-600/60 rounded-xs px-0.5">red</span>, the prefix is not helpful!
          </div>
          <div className="">
              <a className="underline" href="https://www.xentlabs.ai/blog/xent-benchmark" target="_blank" rel="noreferrer">Read more on our blog</a> • {" "}
              <a className="underline" href="https://xent.games/" target="_blank" rel="noreferrer">Try the game</a>
          </div>
        </div>
      </div>
    </div>
  );
}