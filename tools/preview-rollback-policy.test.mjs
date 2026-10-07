import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("validateRollbackRequest", () => {
  it("accepts only the confirmed repository, main ref, matching baseline SHA, and ancestor", () => {
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
    expect(() => validateRollbackRequest({ ...validRequest, ...overrides })).toThrow();
  });
});

describe("restore path and staged file checks", () => {
  it("restores the tree while excluding Supabase, Actions, docs, context, study, and AGENTS.md", () => {
    expect(buildRestorePathspec()).toEqual([
      ".",
      ":(exclude)supabase/**",
      ":(exclude).github/**",
      ":(exclude)docs/**",
      ":(exclude)context/**",
      ":(exclude)study/**",
      ":(exclude)AGENTS.md",
    ]);
  });

  it("rejects an empty change set and any staged protected path", () => {
    expect(() => validateStagedPaths([])).toThrow();
    expect(() => validateStagedPaths(["supabase/migrations/changed.sql"])).toThrow();
    expect(validateStagedPaths(["src/app/page.tsx"])).toEqual(["src/app/page.tsx"]);
  });

  it("restores app files to the baseline and leaves every protected file at its main version", () => {
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
    writeFixtureFile(root, "src/app/page.tsx", "baseline app\n");
    writeFixtureFile(root, "public/logo.svg", "baseline asset\n");
    for (const path of protectedPaths) writeFixtureFile(root, path, "baseline protected\n");
    git(root, "add", ".");
    git(root, "commit", "-m", "baseline");
    git(root, "tag", "preview-baseline");
    const baselineSha = git(root, "rev-parse", "preview-baseline");

    writeFixtureFile(root, "src/app/page.tsx", "changed app\n");
    writeFixtureFile(root, "public/logo.svg", "changed asset\n");
    writeFixtureFile(root, "src/app/new-page.tsx", "new app file\n");
    for (const path of protectedPaths) writeFixtureFile(root, path, "main protected\n");
    git(root, "add", ".");
    git(root, "commit", "-m", "main changes");

    git(root, "restore", "--source=preview-baseline", "--staged", "--worktree", ...buildRestorePathspec());

    expect(readFileSync(join(root, "src/app/page.tsx"), "utf8")).toBe("baseline app\n");
    expect(readFileSync(join(root, "public/logo.svg"), "utf8")).toBe("baseline asset\n");
    expect(readFileSync(join(root, "src/app/new-page.tsx"), "utf8")).toBe("new app file\n");
    for (const path of protectedPaths) {
      expect(readFileSync(join(root, path), "utf8")).toBe("main protected\n");
    }
    expect(git(root, "rev-parse", "preview-baseline")).toBe(baselineSha);
  });
});
