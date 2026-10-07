import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const workflowPath = join(
  process.cwd(),
  ".github",
  "workflows",
  "task3-supabase.yml",
);
const managementScriptPath = join(
  process.cwd(),
  "tools",
  "supabase-management-ci.mjs",
);

describe("Task 3 Supabase CI 계약", () => {
  it("최소 권한 Ubuntu workflow와 안전한 원격 실행 경계를 유지한다", () => {
    expect(existsSync(workflowPath)).toBe(true);
    const workflow = readFileSync(workflowPath, "utf8").replace(/\r\n/g, "\n");
    expect(workflow).toContain("permissions:\n  contents: read");
    expect(workflow).toContain("runs-on: ubuntu-latest");
    expect(workflow).toContain("timeout-minutes:");
    expect(workflow).toContain("concurrency:");
    expect(workflow).toContain("needs: local-db-test");
    expect(workflow).toContain("github.event.repository.fork == false");
    expect(workflow).toContain("refs/heads/task/3-supabase-ci");
    expect(workflow).toContain("task/4-admin-auth");
    expect(workflow).toContain(
      "src/lib/security/rate-limit.integration.test.ts",
    );
    expect(workflow).not.toContain("pull_request_target");
    expect(workflow).not.toContain("environment: supabase-development");
  });

  it("link 없이 공식 Management API만 사용한다", () => {
    const workflow = readFileSync(workflowPath, "utf8").replace(/\r\n/g, "\n");
    expect(workflow).not.toContain("supabase -- link");
    expect(workflow).not.toContain("--linked");
    expect(workflow).not.toContain("db reset");
    expect(workflow).toContain("node tools/supabase-management-ci.mjs");
    expect(workflow).toContain("SUPABASE_ACCESS_TOKEN");
    expect(workflow).toContain("SUPABASE_PROJECT_ID");
    expect(workflow.match(/SUPABASE_ACCESS_TOKEN:/g)).toHaveLength(1);
    expect(
      workflow.indexOf("run: node tools/supabase-management-ci.mjs"),
    ).toBeLessThan(workflow.indexOf("SUPABASE_ACCESS_TOKEN:"));
    expect(workflow).toContain("Secret·Git 추적 대상 검사");
    expect(workflow).toContain(
      "npm exec supabase -- start > /tmp/supabase-start.log 2>&1",
    );
  });

  it("필요한 최소 권한 API와 migration 중복 방지 계약을 고정한다", () => {
    expect(existsSync(managementScriptPath)).toBe(true);
    if (!existsSync(managementScriptPath)) return;
    const script = readFileSync(managementScriptPath, "utf8");
    expect(script).toContain("/v1/projects/${projectRef}");
    expect(script).toContain("/database/migrations");
    expect(script).toContain("/database/query");
    expect(script).toContain("/types/typescript");
    expect(script).toContain("/advisors/security");
    expect(script).toContain("/advisors/performance");
    expect(script).toContain("kwater-prize-draw-dev");
    expect(script).toContain("^[a-z0-9]{20}$");
    expect(script).toContain("KNOWN_REMOTE_VERSIONS");
    expect(script).toContain("20260911025534");
    expect(script).toContain("sameName.length > 1");
    expect(script).toContain("EXPECTED_ASSERTIONS = 127");
    expect(script).toContain("BEGIN;");
    expect(script).toContain("ROLLBACK;");
  });

  it("migration SQL 비교가 문자열 내부의 의미 있는 공백을 보존한다", () => {
    const script = readFileSync(managementScriptPath, "utf8");
    expect(script).not.toContain('.replace(/\\s+/g, " ")');
  });

  it("Task 4 통합 테스트 환경변수와 원격 브랜치 조건이 올바른 Bash 구문이다", () => {
    const workflow = readFileSync(workflowPath, "utf8").replace(/\r\n/g, "\n");
    expect(workflow).toContain('NEXT_PUBLIC_SUPABASE_URL="$API_URL" \\\n');
    expect(workflow).toContain('SUPABASE_SECRET_KEY="$SERVICE_ROLE_KEY" \\\n');
    expect(workflow).not.toContain('"$API_URL" +');
    expect(workflow).toContain("refs/heads/task/4-admin-auth");
  });
});
