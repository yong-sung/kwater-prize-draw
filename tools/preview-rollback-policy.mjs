const EXPECTED_REPOSITORY = "yong-sung/kwater-prize-draw";
const EXPECTED_REF = "refs/heads/main";
const EXPECTED_CONFIRMATION = "PREVIEW BASELINE 복구 PR 생성";
const PROTECTED_ROOTS = ["supabase", ".github", "docs", "context", "study"];
const PROTECTED_FILES = ["AGENTS.md"];

/**
 * @typedef {object} RollbackRequest
 * @property {string} repository
 * @property {string} ref
 * @property {string} confirmation
 * @property {string} requestedSha
 * @property {string} tagSha
 * @property {boolean} isAncestor
 * @property {string|number} runId
 */

/**
 * Rejects requests that restore from an unintended repository or commit.
 * @param {RollbackRequest} input
 * @returns {{ baselineSha: string, branchName: string }}
 */
export function validateRollbackRequest(input) {
  if (!input || typeof input !== "object") {
    throw new Error("복구 요청 정보가 없습니다.");
  }
  if (input.repository !== EXPECTED_REPOSITORY) {
    throw new Error("지정 저장소에서만 복구할 수 있습니다.");
  }
  if (input.ref !== EXPECTED_REF) {
    throw new Error("기본 브랜치에서만 복구할 수 있습니다.");
  }
  if (input.confirmation !== EXPECTED_CONFIRMATION) {
    throw new Error("복구 확인 문구가 일치하지 않습니다.");
  }
  if (
    typeof input.requestedSha !== "string" ||
    typeof input.tagSha !== "string" ||
    !/^[a-f0-9]{40}$/i.test(input.requestedSha) ||
    !/^[a-f0-9]{40}$/i.test(input.tagSha)
  ) {
    throw new Error("기준 SHA는 40자리 hexadecimal이어야 합니다.");
  }
  if (input.requestedSha.toLowerCase() !== input.tagSha.toLowerCase()) {
    throw new Error("입력 SHA와 기준 tag SHA가 일치하지 않습니다.");
  }
  if (input.isAncestor !== true) {
    throw new Error("기준 commit이 현재 main의 조상이 아닙니다.");
  }
  const runId = String(input.runId ?? "");
  if (!/^\d+$/.test(runId)) {
    throw new Error("Workflow 실행 ID 형식이 올바르지 않습니다.");
  }

  return {
    baselineSha: input.tagSha.toLowerCase(),
    branchName: `rollback/preview-baseline-${runId}`,
  };
}

/**
 * Git pathspecs restore the tree while preserving operator-owned paths.
 * @returns {string[]}
 */
export function buildRestorePathspec() {
  return [
    ".",
    ":(exclude)supabase/**",
    ":(exclude).github/**",
    ":(exclude)docs/**",
    ":(exclude)context/**",
    ":(exclude)study/**",
    ":(exclude)AGENTS.md",
  ];
}

/**
 * Checks the staged file list before a rollback branch is pushed.
 * @param {string[]} paths
 * @returns {string[]}
 */
export function validateStagedPaths(paths) {
  if (!Array.isArray(paths) || paths.length === 0) {
    throw new Error("복원할 코드 변경이 없습니다.");
  }

  const normalizedPaths = paths.map((path) => {
    if (typeof path !== "string" || path.length === 0) {
      throw new Error("staged 파일 목록에 잘못된 경로가 있습니다.");
    }

    const normalized = path.replaceAll("\\", "/").replace(/^(\.\/)+/, "");
    if (
      normalized.startsWith("/") ||
      normalized.split("/").includes("..") ||
      PROTECTED_FILES.includes(normalized) ||
      PROTECTED_ROOTS.includes(normalized.split("/")[0])
    ) {
      throw new Error(`보호 경로가 복구 변경에 포함되어 있습니다: ${path}`);
    }

    return normalized;
  });

  return [...new Set(normalizedPaths)];
}

import { appendFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

function runGit(args) {
  const result = spawnSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args[0]} failed.`);
  }
  return result.stdout.trim();
}

function writeGithubOutput(values) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) {
    throw new Error("GITHUB_OUTPUT 경로가 없습니다.");
  }
  const lines = Object.entries(values).map(([key, value]) => `${key}=${value}`);
  appendFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
}

function validateRequestFromEnvironment() {
  const tagSha = runGit([
    "rev-parse",
    "--verify",
    "refs/tags/preview-baseline-2026-10-07^{commit}",
  ]);
  const ancestry = spawnSync(
    "git",
    ["merge-base", "--is-ancestor", tagSha, "HEAD"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  if (ancestry.error) throw ancestry.error;
  if (ancestry.status !== 0 && ancestry.status !== 1) {
    throw new Error(ancestry.stderr.trim() || "기준 commit 조상을 확인할 수 없습니다.");
  }

  const validated = validateRollbackRequest({
    repository: process.env.GITHUB_REPOSITORY,
    ref: process.env.GITHUB_REF,
    confirmation: process.env.ROLLBACK_CONFIRMATION,
    requestedSha: process.env.ROLLBACK_BASELINE_SHA,
    tagSha,
    isAncestor: ancestry.status === 0,
    runId: process.env.GITHUB_RUN_ID,
  });
  writeGithubOutput({
    baseline_sha: validated.baselineSha,
    branch_name: validated.branchName,
  });
}

function validateStagedChanges() {
  const result = spawnSync("git", ["diff", "--cached", "--name-only", "-z"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || "staged 파일 목록을 확인할 수 없습니다.");
  }

  const paths = result.stdout.split("\0").filter(Boolean);
  const validatedPaths = validateStagedPaths(paths);
  writeGithubOutput({ staged_count: validatedPaths.length });
}

function restoreBaseline() {
  const baselineSha = process.env.ROLLBACK_BASELINE_SHA ?? "";
  if (!/^[a-f0-9]{40}$/i.test(baselineSha)) {
    throw new Error("기준 SHA는 40자리 hexadecimal이어야 합니다.");
  }

  const commit = spawnSync(
    "git",
    ["cat-file", "-e", `${baselineSha}^{commit}`],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  if (commit.error) throw commit.error;
  if (commit.status !== 0) {
    throw new Error("기준 commit을 찾을 수 없습니다.");
  }

  runGit([
    "restore",
    `--source=${baselineSha}`,
    "--staged",
    "--worktree",
    ...buildRestorePathspec(),
  ]);
}

function main(command) {
  if (command === "validate-request") {
    validateRequestFromEnvironment();
    return;
  }
  if (command === "validate-staged") {
    validateStagedChanges();
    return;
  }
  if (command === "restore") {
    restoreBaseline();
    return;
  }
  throw new Error("지원하지 않는 복구 검증 명령입니다.");
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  try {
    main(process.argv[2]);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
