import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const workflowPath = join(
  process.cwd(),
  ".github",
  "workflows",
  "task3-supabase.yml",
);

describe("Task 3 Supabase CI 계약", () => {
  it("최소 권한의 Ubuntu 워크플로가 존재한다", () => {
    expect(existsSync(workflowPath)).toBe(true);
    if (!existsSync(workflowPath)) return;

    const workflow = readFileSync(workflowPath, "utf8");
    expect(workflow).toContain("permissions:\n  contents: read");
    expect(workflow).toContain("runs-on: ubuntu-latest");
    expect(workflow).toContain("timeout-minutes:");
    expect(workflow).toContain("concurrency:");
  });

  it("로컬 DB 검증 이후에만 전용 개발 프로젝트를 배포한다", () => {
    expect(existsSync(workflowPath)).toBe(true);
    if (!existsSync(workflowPath)) return;

    const workflow = readFileSync(workflowPath, "utf8");
    expect(workflow).toContain("local-db-test:");
    expect(workflow).toContain("deploy-and-test-development:");
    expect(workflow).toContain("needs: local-db-test");
    expect(workflow).not.toContain("environment: supabase-development");
    expect(workflow).toContain("github.event.repository.fork == false");
    expect(workflow).toContain("refs/heads/task/3-supabase-ci");
    expect(workflow).not.toContain("pull_request_target");
  });

  it("고정 CLI와 안전한 원격 검증 순서를 사용한다", () => {
    expect(existsSync(workflowPath)).toBe(true);
    if (!existsSync(workflowPath)) return;

    const workflow = readFileSync(workflowPath, "utf8");
    expect(workflow).toContain("npm ci");
    expect(workflow).toContain("npm exec supabase --");
    expect(workflow).not.toContain("supabase@latest");
    expect(workflow.match(/tsc --noEmit --ignoreConfig/g)).toHaveLength(2);
    expect(workflow).toContain("db push --dry-run --linked");
    expect(workflow).toContain("db push --linked");
    expect(workflow).not.toContain("db reset --linked");
    expect(workflow).toContain("test db --linked");
    expect(workflow).toContain("db advisors --linked --type security");
    expect(workflow).toContain("db advisors --linked --type performance");
    expect(workflow).toContain("^[a-z0-9]{20}$");
    expect(workflow).toContain("id: migration-state");
    expect(workflow).toContain(
      "if: steps.migration-state.outputs.already-applied != 'true'",
    );
    expect(workflow.indexOf("Database Advisors security")).toBeLessThan(
      workflow.indexOf("생성 타입 일치 강제"),
    );
  });
});
