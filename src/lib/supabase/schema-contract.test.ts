import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationsDirectory = join(process.cwd(), "supabase", "migrations");

describe("Supabase 스키마 계약", () => {
  it("CLI로 생성된 초기 migration 파일이 존재한다", () => {
    expect(existsSync(migrationsDirectory)).toBe(true);
    if (!existsSync(migrationsDirectory)) return;

    expect(
      readdirSync(migrationsDirectory).some((file) =>
        file.endsWith("_initial.sql"),
      ),
    ).toBe(true);
  });

  it("생성된 migration은 UTF-8로 읽을 수 있다", () => {
    if (!existsSync(migrationsDirectory)) {
      throw new Error("Supabase migration 디렉터리가 없습니다");
    }

    const migration = readdirSync(migrationsDirectory).find((file) =>
      file.endsWith("_initial.sql"),
    );
    if (!migration) throw new Error("초기 migration 파일이 없습니다");

    expect(
      readFileSync(join(migrationsDirectory, migration), "utf8"),
    ).not.toContain("�");
  });

  it("적용된 초기 migration을 변경하지 않고 리뷰 보정 migration을 추가한다", () => {
    const correction = readdirSync(migrationsDirectory).find((file) =>
      file.endsWith("_task3_review_fixes.sql"),
    );
    expect(correction).toBeDefined();
    if (!correction) return;

    const sql = readFileSync(join(migrationsDirectory, correction), "utf8");
    expect(sql).toContain("draw_results_event_participant_fkey");
    expect(sql).toContain("draw_results_event_prize_fkey");
    expect(sql).toContain("if v_was_revealed then");
  });

  it("후보 없는 공개 슬롯 보정은 별도 migration에서 REVEALED 상태를 유지한다", () => {
    const correction = readdirSync(migrationsDirectory).find((file) =>
      file.endsWith("_task3_reveal_state_fix.sql"),
    );
    expect(correction).toBeDefined();
    if (!correction) return;

    const sql = readFileSync(join(migrationsDirectory, correction), "utf8");
    expect(sql).toContain("v_replacement_participant_id is not null");
    expect(sql).toContain("set status = 'REVEALING'");
  });
});
