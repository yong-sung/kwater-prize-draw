import type { RevealGroup } from "./RevealStage";

const REVEAL_ORDER = new Map([
  ["KEYBOARD", 1],
  ["TUMBLER", 2],
  ["SCANNER", 3],
]);

export function orderRevealGroups(groups: RevealGroup[]): RevealGroup[] {
  return [...groups].sort(
    (left, right) =>
      (REVEAL_ORDER.get(left.prizeCode) ?? Number.MAX_SAFE_INTEGER) -
      (REVEAL_ORDER.get(right.prizeCode) ?? Number.MAX_SAFE_INTEGER),
  );
}
