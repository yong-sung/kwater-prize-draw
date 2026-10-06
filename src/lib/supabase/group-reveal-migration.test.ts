import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260930090653_grouped_sequential_reveal.sql",
  "utf8",
);

const normalized = migration.replace(/\s+/g, " ");

describe("경품 그룹 순차 공개 migration", () => {
  it("행사 잠금과 고정 순서로 한 명만 공개하고 경품 경계에서는 변경하지 않는다", () => {
    expect(normalized).toContain("pg_advisory_xact_lock");
    expect(normalized).toContain("for update");
    expect(normalized).toContain("skip locked");
    expect(normalized).toContain("when 'KEYBOARD' then 1");
    expect(normalized).toContain("when 'TUMBLER' then 2");
    expect(normalized).toContain("when 'SCANNER' then 3");
    expect(normalized).toContain("GROUP_COMPLETE");
    expect(normalized).toContain("set revealed_at = statement_timestamp()");
  });

  it("새 RPC 실행 권한을 service_role에만 부여한다", () => {
    expect(normalized).toContain(
      "revoke all on function public.reveal_next_in_group(uuid, public.prize_code)",
    );
    expect(normalized).toContain(
      "grant execute on function public.reveal_next_in_group(uuid, public.prize_code) to service_role",
    );
  });
});
