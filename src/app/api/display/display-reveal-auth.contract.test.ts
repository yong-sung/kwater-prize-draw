import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relative: string) =>
  readFileSync(resolve(root, relative), "utf8");

describe("강연장 전용 공용 비밀번호 인증 계약", () => {
  it("전용 로그인 route가 HttpOnly display 세션을 발급해야 한다", () => {
    const route = "src/app/api/display/auth/login/route.ts";
    expect(existsSync(resolve(root, route))).toBe(true);
    const source = read(route) + read("src/lib/security/display-session.ts");
    expect(source).toContain("display_session");
  });

  it("전용 event API는 display 세션과 revealed_at 결과만 사용해야 한다", () => {
    const route = "src/app/api/display/event/route.ts";
    expect(existsSync(resolve(root, route))).toBe(true);
    const source = read(route);
    expect(source).toContain("requireDisplaySession");
    expect(source).toContain("revealed_at");
    expect(source).toContain("name");
    expect(source).toContain("department");
    expect(source).not.toContain("phone_ciphertext");
    expect(source).not.toContain("access_token");
  });

  it("공개 event API는 당첨자 개인정보를 반환하지 않아야 한다", () => {
    const source = read("src/app/api/public/event/route.ts");
    expect(source).not.toContain("name_ciphertext");
    expect(source).not.toContain("department_ciphertext");
    expect(source).not.toContain("groups");
  });

  it("강연장 공개 화면은 관리자 reveal API가 아닌 전용 API를 호출해야 한다", () => {
    const source = read("src/features/display/DisplayApp.tsx");
    expect(source).toContain("/api/display/event");
    expect(source).not.toContain("/api/admin/reveal");
  });

  it("display 페이지는 세션이 없을 때 로그인 화면을 제공해야 한다", () => {
    const source = read("src/features/display/DisplayGate.tsx");
    expect(source).toContain("공용 비밀번호");
    expect(source).toContain("로그인");
  });
});
