"use client";

export const Anchors = {
  playButton: "play-button",
  barRace: "bar-race",
  explainerMove: "explainer-move",
  explainerTokens: "explainer-tokens",
  gameRules: "game-rules",
  todaysGame: "todays-game",
  barForModel: (id: string) => `model-${id}`,
};

export function TourAnchor({ anchor, className, children }: { anchor: string; className?: string; children: React.ReactNode; }) {
  return <div data-tour={anchor} className={className ?? ""}>{children}</div>;
}

export function anchorSelector(anchor: string) {
  return `[data-tour="${anchor}"]`;
}
/// Use as { ...anchorToProps(anchor) } when using the Anchor component is not possible
export function anchorToProps(anchor: string) {
  return { "data-tour": anchor };
}