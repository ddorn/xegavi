export type EventType =
  | "big_jump"
  | "first_to_top"
  | "lead_change"
  | "max_token_positive"
  | "max_token_negative";

export type Event = {
  type: EventType;
  modelId: string;
  round: number; // 0-based
  magnitudeRaw: number; // unnormalized
  magnitudeNorm: number; // normalized per policy rules
  details: Record<string, unknown>;
};

export type StepTemplate = {
  id: string;
  attachTo: { element: string; on: "top" | "bottom" | "left" | "right" };
  text: string;
  advanceOn?: { selector: string; event: "click" };
  onShow?: (() => void)[];
  onHide?: (() => void)[];
};

export type TourPlan = { steps: StepTemplate[] };