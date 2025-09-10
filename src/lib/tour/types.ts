export type EventType =
  | "big_jump"
  | "first_to_top"
  | "lead_change"
  | "max_token_positive"
  | "max_token_negative";

interface EventBase {
  modelId: string;
  round: number; // 0-based
  magnitudeRaw: number; // unnormalized
  magnitudeNorm: number; // normalized per policy rules
}

export type FirstToTopEvent = EventBase & {
  type: "first_to_top";
  details: {
    startRank: number;
  };
};

export type BigJumpEvent = EventBase & {
  type: "big_jump";
  details: {
    delta: number;
    previousScore: number;
    newScore: number;
  };
};

export type LeadChangeEvent = EventBase & {
  type: "lead_change";
  details: {
    previousLeaderId: string;
    margin: number;
    leaderScore: number;
    runnerUpScore: number;
  };
};

export type MaxTokenPositiveEvent = EventBase & {
  type: "max_token_positive";
  details: {
    token: string;
    previousScore: number;
    currentScore: number;
    change: number;
    seqIndex: number;
    tokenIndex: number;
  };
};

export type MaxTokenNegativeEvent = EventBase & {
  type: "max_token_negative";
  details: {
    token: string;
    previousScore: number;
    currentScore: number;
    change: number;
    absChange: number;
    seqIndex: number;
    tokenIndex: number;
  };
};

export type Event =
  | FirstToTopEvent
  | BigJumpEvent
  | LeadChangeEvent
  | MaxTokenPositiveEvent
  | MaxTokenNegativeEvent;

export type StepTemplate = {
  id: string;
  attachTo: { element: string; on: "top" | "bottom" | "left" | "right" };
  text: string;
  advanceOn?: { selector: string; event: "click" } | { round: number };
  onShow?: (() => void)[];
  onHide?: (() => void)[];
};

export type TourPlan = { steps: StepTemplate[] };