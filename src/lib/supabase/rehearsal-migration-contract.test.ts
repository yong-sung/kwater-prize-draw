import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const sql = readFileSync(
  "supabase/migrations/20260929003215_auditorium_rehearsal_reset.sql",
  "utf8",
);

describe("리허설 migration 잠금 계약", () => {
  it("만료 삭제도 advisory lock 후 행사 행을 잠근다", () => {
    const fn = sql.slice(
      sql.indexOf("create or replace function public.purge_expired_events"),
    );

    expect(fn).toContain("pg_advisory_xact_lock");
    expect(fn.indexOf("pg_advisory_xact_lock")).toBeLessThan(
      fn.indexOf("for update"),
    );
  });
});
