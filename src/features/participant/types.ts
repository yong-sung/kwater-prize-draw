import type { PrizeCode } from "@/lib/domain/types";

// src/features/participant/types.ts
export type ParticipantView =
  | { kind: "FORM" }
  | { kind: "CLOSED" }
  | { kind: "WAITING"; name: string }
  | { kind: "WINNER"; name: string; prizeCode: PrizeCode; prizeName: string }
  | { kind: "NOT_WINNER"; name: string }
  | { kind: "PURGED" }
  | { kind: "LOADING" }
  | { kind: "ERROR"; message: string };
