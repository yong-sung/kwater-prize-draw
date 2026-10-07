import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildRestorePathspec,
  validateRollbackRequest,
  validateStagedPaths,
} from "./preview-rollback-policy.mjs";

const validRequest = {
  repository: "yong-sung/kwater-prize-draw",
  ref: "refs/heads/main",
  confirmation: "PREVIEW BASELINE 복구 PR 생성",
  requestedSha: "de4aebb6d0503d4d453911bf0bd68a1dde11fd87",
  tagSha: "de4aebb6d0503d4d453911bf0bd68a1dde11fd87",
  isAncestor: true,
  runId: "123456",
};

const temporaryDirectories = [];
const policyScriptPath = resolve("tools/preview-rollback-policy.mjs");

function writeFixtureFile(root, path, contents) {
  const fullPath = join(root, path);
  mkdirSync(join(fullPath, ".."), { recursive: true });
  writeFileSync(fullPath, contents);
}

function git(root, ...args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function runPolicyCli(root, command, env = {}) {
  return spawnSync(process.execPath, [policyScriptPath, command], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("validateRollbackRequest", () => {
  it("accepts a valid baseline rollback request", () => {
    expect(validateRollbackRequest(validRequest)).toEqual({
      baselineSha: validRequest.tagSha,
      branchName: "rollback/preview-baseline-123456",
    });
  });

  it.each([
    ["another repository", { repository: "someone/else" }],
    ["a non-main ref", { ref: "refs/heads/feature" }],
    ["the wrong confirmation", { confirmation: "복구" }],
    ["a malformed requested SHA", { requestedSha: "abc123" }],
    ["a tag and requested SHA mismatch", { requestedSha: "a".repeat(40) }],
    ["a baseline outside main history", { isAncestor: false }],
  ])("rejects %s", (_condition, overrides) => {
    expect(() =>
      validateRollbackRequest({ ...validRequest, ...overrides }),
    ).toThrow();
  });
});

describe("restore path and staged file checks", () => {
  it("excludes all protected paths", () => {
    expect(buildRestorePathspec()).toEqual([
      ".",
      ":(exclude)supabase/**",
      ":(exclude).github/**",
      ":(exclude)docs/**",
      ":(exclude)context/**",
      ":(exclude)study/**",
      ":(exclude)AGENTS.md",
      ":(exclude)tools/preview-rollback-policy.mjs",
    ]);
  });

  it("rejects an empty change set and any staged protected path", () => {
    expect(() => validateStagedPaths([])).toThrow();
    expect(() =>
      validateStagedPaths(["supabase/migrations/changed.sql"]),
    ).toThrow();
    expect(() =>
      validateStagedPaths(["tools/preview-rollback-policy.mjs"]),
    ).toThrow();
    const allowedPaths = validateStagedPaths(["src/app/page.tsx"]);
    expect(allowedPaths).toEqual(["src/app/page.tsx"]);
  });

  it("restores app files and preserves protected paths", () => {
    const root = mkdtempSync(join(tmpdir(), "preview-code-rollback-"));
    temporaryDirectories.push(root);
    git(root, "init");
    git(root, "checkout", "-b", "main");
    git(root, "config", "user.name", "Rollback Policy Test");
    git(root, "config", "user.email", "rollback-test@example.invalid");

    const protectedPaths = [
      "supabase/migrations/keep.sql",
      ".github/workflows/keep.yml",
      "docs/keep.md",
      "context/keep.md",
      "study/keep.md",
      "AGENTS.md",
    ];
    const runtimeToolPath = "tools/preview-rollback-policy.mjs";
    writeFixtureFile(root, "src/app/page.tsx", "baseline app\n");
    writeFixtureFile(root, "public/logo.svg", "baseline asset\n");
    for (const path of protectedPaths) {
      writeFixtureFile(root, path, "baseline protected\n");
    }
    git(root, "add", ".");
    git(root, "commit", "-m", "baseline");
    git(root, "tag", "preview-baseline");
    const baselineSha = git(root, "rev-parse", "preview-baseline");

    writeFixtureFile(root, "src/app/page.tsx", "changed app\n");
    writeFixtureFile(root, "public/logo.svg", "changed asset\n");
    writeFixtureFile(root, "src/app/new-page.tsx", "new app file\n");
    for (const path of protectedPaths) {
      writeFixtureFile(root, path, "main protected\n");
    }
    writeFixtureFile(root, runtimeToolPath, "main rollback tool\n");
    git(root, "add", ".");
    git(root, "commit", "-m", "main changes");

    git(
      root,
      "restore",
      "--source=preview-baseline",
      "--staged",
      "--worktree",
      ...buildRestorePathspec(),
    );

    const restoredApp = readFileSync(join(root, "src/app/page.tsx"), "utf8");
    expect(restoredApp).toBe("baseline app\n");
    const restoredLogo = readFileSync(join(root, "public/logo.svg"), "utf8");
    expect(restoredLogo).toBe("baseline asset\n");
    expect(existsSync(join(root, "src/app/new-page.tsx"))).toBe(false);
    for (const path of protectedPaths) {
      expect(readFileSync(join(root, path), "utf8")).toBe("main protected\n");
    }
    expect(readFileSync(join(root, runtimeToolPath), "utf8")).toBe(
      "main rollback tool\n",
    );
    expect(git(root, "rev-parse", "preview-baseline")).toBe(baselineSha);
  });
});

describe("rollback policy CLI", () => {
  it("writes validated baseline outputs to GITHUB_OUTPUT", () => {
    const root = mkdtempSync(join(tmpdir(), "preview-rollback-cli-"));
    temporaryDirectories.push(root);
    git(root, "init");
    git(root, "checkout", "-b", "main");
    git(root, "config", "user.name", "Rollback Policy Test");
    git(root, "config", "user.email", "rollback-test@example.invalid");
    writeFixtureFile(root, "src/app/page.tsx", "baseline app\n");
    git(root, "add", ".");
    git(root, "commit", "-m", "baseline");
    git(root, "tag", "preview-baseline-2026-10-07");
    const baselineSha = git(root, "rev-parse", "preview-baseline-2026-10-07");
    writeFixtureFile(root, "src/app/page.tsx", "main app\n");
    git(root, "add", ".");
    git(root, "commit", "-m", "main changes");
    const outputPath = join(root, "workflow-output.txt");

    const result = runPolicyCli(root, "validate-request", {
      GITHUB_REPOSITORY: "yong-sung/kwater-prize-draw",
      GITHUB_REF: "refs/heads/main",
      ROLLBACK_CONFIRMATION: "PREVIEW BASELINE 복구 PR 생성",
      ROLLBACK_BASELINE_SHA: baselineSha,
      GITHUB_RUN_ID: "456",
      GITHUB_OUTPUT: outputPath,
    });

    expect(result.status).toBe(0);
    expect(existsSync(outputPath)).toBe(true);
    expect(readFileSync(outputPath, "utf8")).toBe(
      [
        `baseline_sha=${baselineSha}`,
        "branch_name=rollback/preview-baseline-456",
      ].join("\n") + "\n",
    );
  });

  it("restores through the CLI while preserving protected paths", () => {
    const root = mkdtempSync(join(tmpdir(), "preview-rollback-cli-"));
    temporaryDirectories.push(root);
    git(root, "init");
    git(root, "checkout", "-b", "main");
    git(root, "config", "user.name", "Rollback Policy Test");
    git(root, "config", "user.email", "rollback-test@example.invalid");
    writeFixtureFile(root, "src/app/page.tsx", "baseline app\n");
    writeFixtureFile(root, "docs/keep.md", "baseline docs\n");
    git(root, "add", ".");
    git(root, "commit", "-m", "baseline");
    const baselineSha = git(root, "rev-parse", "HEAD");
    writeFixtureFile(root, "src/app/page.tsx", "main app\n");
    writeFixtureFile(root, "docs/keep.md", "main docs\n");
    writeFixtureFile(root, "tools/preview-rollback-policy.mjs", "main rollback tool\n");
    git(root, "add", ".");
    git(root, "commit", "-m", "main changes");

    const result = runPolicyCli(root, "restore", {
      ROLLBACK_BASELINE_SHA: baselineSha,
    });

    expect(result.status).toBe(0);
    expect(readFileSync(join(root, "src/app/page.tsx"), "utf8")).toBe(
      "baseline app\n",
    );
    expect(readFileSync(join(root, "docs/keep.md"), "utf8")).toBe(
      "main docs\n",
    );
    expect(
      readFileSync(join(root, "tools/preview-rollback-policy.mjs"), "utf8"),
    ).toBe("main rollback tool\n");
    expect(git(root, "diff", "--cached", "--name-only")).toBe(
      "src/app/page.tsx",
    );
  });

  it("fails before branch or PR work when no files are staged", () => {
    const root = mkdtempSync(join(tmpdir(), "preview-rollback-cli-"));
    temporaryDirectories.push(root);
    git(root, "init");
    git(root, "checkout", "-b", "main");
    git(root, "config", "user.name", "Rollback Policy Test");
    git(root, "config", "user.email", "rollback-test@example.invalid");
    writeFixtureFile(root, "src/app/page.tsx", "main app\n");
    git(root, "add", ".");
    git(root, "commit", "-m", "main");
    const outputPath = join(root, "workflow-output.txt");

    const result = runPolicyCli(root, "validate-staged", {
      GITHUB_OUTPUT: outputPath,
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("복원할 코드 변경이 없습니다.");
    expect(existsSync(outputPath)).toBe(false);
  });
});
