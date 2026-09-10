export const EVENT_STATUSES = [
  "SETUP",
  "OPEN",
  "CLOSED",
  "DRAWN",
  "REVEALING",
  "REVEALED",
  "PUBLISHED",
  "PURGED",
] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

export const PRIZE_CODES = ["SCANNER", "TUMBLER", "KEYBOARD"] as const;

export type PrizeCode = (typeof PRIZE_CODES)[number];
