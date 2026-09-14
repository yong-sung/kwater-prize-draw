export type DrawInvariantInput = {
  results: Array<{ participantId: string; prizeId: string }>;
  prizeLimits: Record<string, number>;
};
export function assertDrawInvariants(input: DrawInvariantInput): void {
  const participants = new Set<string>();
  const counts = new Map<string, number>();
  for (const result of input.results) {
    if (participants.has(result.participantId))
      throw new Error("DUPLICATE_WINNER");
    participants.add(result.participantId);
    const count = (counts.get(result.prizeId) ?? 0) + 1;
    if (count > (input.prizeLimits[result.prizeId] ?? 0))
      throw new Error("PRIZE_LIMIT_EXCEEDED");
    counts.set(result.prizeId, count);
  }
}
