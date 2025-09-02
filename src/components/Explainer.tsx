"use client";

import React from "react";

export interface ExplainerProps {
  className?: string;
}

const rightArrowUnicode = "→";

export function Explainer({ className }: ExplainerProps) {
  return (
    <section className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-md p-4">
          <h3 className="font-black text-xl mb-2">The Framework</h3>
          <div className="space-y-3 text-[0.975rem] leading-relaxed">
            <p>
              We built a benchmark of mathematically grounded textual games. For each game, a model gets 30 tries. After each try, it gets a score. The core test is how effectively it uses the history of its scores to make better attempts. This measures meta-learning and reasoning, not just raw knowledge.
            </p>
            <p className="mt-4">
              {rightArrowUnicode} {" "}
              <a
                className="underline"
                href="https://www.xentlabs.ai/blog/xent-benchmark"
                target="_blank"
                rel="noreferrer"
              >
                More details on our blog
              </a>
            </p>
          </div>
        </div>

        <div className="rounded-md p-4">
          <h3 className="font-black text-xl mb-2">Today's game: Condense</h3>
          <div className="space-y-3 text-[0.975rem] leading-relaxed">
            <p>
              <span className="font-semibold">Rules:</span> The player must find a short "hint" that helps the judge AI (Qwen 14B) predict a given text, but without reusing any of its words.
            </p>
            <p>
              <span className="font-semibold">Scoring:</span> The score is a measure of how much more likely the judge is to predict the text given the prefix than without. It's measured in logits (logarithms of probability) and is the sum for every token of the logits gained (or lost) by prepending the prefix.
            </p>
          </div>
          <div className="mt-4">
            {rightArrowUnicode} {" "}
              <a
                className="underline"
                href="https://xent.games/"
                target="_blank"
                rel="noreferrer"
              >
                Play the game
              </a>
          </div>
        </div>
      </div>
    </section>
  );
}