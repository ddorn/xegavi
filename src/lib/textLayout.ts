export interface LaidOutTokenWidth {
  token: string;
  index: number;
  widthPct: number;
  isLastInLine: boolean;
}

/**
 * Computes a multi-line layout for tokens without splitting tokens.
 * - Greedy: fill each line until exceeding the target width (total/numLines)
 * - Global scale: percentages are anchored to the widest line so nothing overflows
 * - Ragged right: non-widest lines will sum to < 100%
 */
export function computeMultilineTokenLayout(
  tokens: string[],
  numLines: number,
  measure: (token: string) => number
): LaidOutTokenWidth[][] {
  const safeNumLines = Math.max(1, Math.floor(numLines));
  if (tokens.length === 0) return [];

  const widths = tokens.map((t) => Math.max(0, measure(t)));
  const total = widths.reduce((s, w) => s + w, 0);
  if (total === 0) {
    // All zero widths, return a single line with evenly distributed zero-width tokens
    return [tokens.map((token, index) => ({ token, index, widthPct: 0, isLastInLine: index === tokens.length - 1 }))];
  }

  const targetPerLine = total / safeNumLines;

  // Partition greedily into contiguous lines without splitting tokens
  const lineTokenIndices: number[][] = [];
  let cursor = 0;
  for (let lineIdx = 0; lineIdx < safeNumLines && cursor < tokens.length; lineIdx++) {
    let lineSum = 0;
    const indices: number[] = [];
    while (cursor < tokens.length) {
      const w = widths[cursor];
      indices.push(cursor);
      lineSum += w;
      cursor += 1;
      if (lineSum > targetPerLine) break;
    }
    if (indices.length > 0) lineTokenIndices.push(indices);
  }

  // If any tokens remain (due to numLines smaller than tokens needed), put the rest on the last line
  if (cursor < tokens.length) {
    if (lineTokenIndices.length === 0) {
      lineTokenIndices.push([]);
    }
    const last = lineTokenIndices[lineTokenIndices.length - 1];
    for (; cursor < tokens.length; cursor++) {
      last.push(cursor);
    }
  }

  // Compute line widths and the max line width to anchor percentages
  const lineWidths = lineTokenIndices.map((idxs) => idxs.reduce((s, i) => s + widths[i], 0));
  const maxLineWidth = Math.max(...lineWidths, targetPerLine);

  // Build output with width percentages anchored to the max line width
  const lines: LaidOutTokenWidth[][] = lineTokenIndices.map((idxs) =>
    idxs.map((i, localIdx) => ({
      token: tokens[i],
      index: i,
      widthPct: (widths[i] / maxLineWidth) * 100,
      isLastInLine: localIdx === idxs.length - 1,
    }))
  );

  return lines;
}