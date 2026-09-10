import type { EventStatus } from "./types";

const allowedTransitions: Readonly<
  Record<EventStatus, readonly EventStatus[]>
> = {
  SETUP: ["OPEN"],
  OPEN: ["CLOSED"],
  CLOSED: ["OPEN", "DRAWN"],
  DRAWN: ["REVEALING", "REVEALED"],
  REVEALING: ["REVEALING", "REVEALED"],
  REVEALED: ["PUBLISHED"],
  PUBLISHED: ["PURGED"],
  PURGED: ["SETUP"],
};

export function assertTransition(from: EventStatus, to: EventStatus): void {
  if (!allowedTransitions[from].includes(to)) {
    throw new Error("허용되지 않는 행사 상태 전환");
  }
}
