"use client";

import React from "react";
import { TokenScoresBox } from "./TokenScoresBox";

export interface ExplainerProps {
  className?: string;
  vertical?: boolean;
  showFramework?: boolean;
  tokenScores?: Array<[string, number]>;
}

const rightArrowUnicode = "→";

export function Explainer({ className, vertical = false, showFramework = true, tokenScores }: ExplainerProps) {

  const gridClass = vertical || !showFramework ? "grid-cols-1" : "grid-cols-2";

  return (
    <section className={className}>
      <div className={`grid ${gridClass} gap-8`}>
        {showFramework && (
        <div className="">
          <h3 className="font-black text-xl mb-2">The Framework</h3>
          <div className="space-y-3 text-[0.975rem] leading-relaxed">
            <p>
              We built a benchmark of mathematically grounded textual games. For
              each game, a model gets 30 tries. After each try, it gets a score.
              The core test is how effectively it uses the history of its scores
              to make better attempts. This measures meta-learning and
              reasoning, not just raw knowledge.
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
        )}

        <div className="">
          <h3 className="font-black text-xl mb-2" data-tour="">Today&apos;s game: Condense</h3>
          <div className="space-y-3 text-[0.975rem] leading-relaxed">
            <p>
              <span className="font-semibold">Rules:</span> Find a short
              &quot;hint&quot; that helps the judge AI (Qwen 14B) predict a
              given text, but without reusing any of its words.
            </p>
            <p>
              <span className="font-semibold">Scoring:</span> The score is a
              measure of how much more likely the judge is to predict the text
              prefixed by the hint than without. It&apos;s measured in
              logits (logarithms of probability) and is the sum for every token
              of the logits gained (or lost) by prepending the hint.
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


          {tokenScores && (
          <div className="max-w-100 text-center">
            {/* <div className="text-sm font-semibold mb-2">Text</div> */}
            <div className="leading-7 text-lg">
              <span className="bg-amber-100 text-neutral-500 border rounded-md px-2 py-1 mr-2">PREFIX...</span>
              <TokenScoresBox tokenScores={tokenScores} className="inline align-baseline leading-7" />
          </div>
          </div>
        )}
      </div>
    </section>
  );
}