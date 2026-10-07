import { describe, expect, it } from "vitest";
import { canResetRehearsal } from "./reset-guard";

const allowed = {
  VERCEL_ENV: "preview",
  NEXT_PUBLIC_SUPABASE_URL: "https://preview-project.supabase.co",
  ALLOW_REHEARSAL_RESET: "true",
  SUPABASE_PROJECT_ID: "preview-project",
  REHEARSAL_ALLOWED_SUPABASE_PROJECT_ID: "preview-project",
};

describe("리허설 초기화 환경 보호", () => {
  it("Preview의 명시적 허용과 프로젝트 일치만 허용한다", () => {
    expect(canResetRehearsal(allowed)).toBe(true);
  });
  it.each([
    "VERCEL_ENV",
    "ALLOW_REHEARSAL_RESET",
    "SUPABASE_PROJECT_ID",
    "REHEARSAL_ALLOWED_SUPABASE_PROJECT_ID",
  ])("%s가 없으면 거부한다", (key) => {
    expect(canResetRehearsal({ ...allowed, [key]: undefined })).toBe(false);
  });
  it("프로젝트 ID가 다르면 거부한다", () => {
    expect(
      canResetRehearsal({ ...allowed, SUPABASE_PROJECT_ID: "other" }),
    ).toBe(false);
  });
  it("Production에서는 모든 값이 맞아도 거부한다", () => {
    expect(canResetRehearsal({ ...allowed, VERCEL_ENV: "production" })).toBe(
      false,
    );
  });
});
