import type { EventType } from "./types";

export type EventPolicy = {
  weights: Record<EventType, number>;
  mins: Partial<Record<EventType, number>>; // minimum magnitudeRaw to include
};

export const DefaultPolicy: EventPolicy = {
  weights: {
    first_to_top: 20.0,
    lead_change: 1.0,
    big_jump: 1.0,
    max_token_positive: 0,
    max_token_negative: 0,
  },
  mins: {
    big_jump: 1.0,
    max_token_positive: 1,
    max_token_negative: 1,
    lead_change: 0.5,
  },
};