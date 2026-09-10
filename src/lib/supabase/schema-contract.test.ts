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
});
