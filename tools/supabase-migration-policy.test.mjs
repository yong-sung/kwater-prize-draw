import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { assertExpectedMigrationFiles } from "./supabase-migration-policy.mjs";

const expected = [
  "20260910003438_initial.sql",
  "20260911114700_task3_review_fixes.sql",
  "20260911133000_task3_reveal_state_fix.sql",
  "20260911170000_admin_login_rate_limit.sql",
  "20260929003215_auditorium_rehearsal_reset.sql",
];

describe("Supabase migration 허용 목록", () => {
  it("저장소의 승인된 5개 migration을 적용 순서대로 허용한다", () => {
    const actual = readdirSync(join(process.cwd(), "supabase", "migrations"))
      .filter((name) => name.endsWith(".sql"))
      .sort();

    expect(actual).toEqual(expected);
    expect(assertExpectedMigrationFiles(actual)).toEqual(expected);
  });

  it("개수가 같아도 예상하지 못한 migration을 거부한다", () => {
    const unexpected = [
      ...expected.slice(0, -1),
      "20260930000000_unexpected.sql",
    ];

    expect(() => assertExpectedMigrationFiles(unexpected)).toThrow(
      "예상하지 못한 migration 목록",
    );
  });
});
