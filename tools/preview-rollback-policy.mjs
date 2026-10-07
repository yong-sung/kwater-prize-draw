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
 * Rejects any request that could restore from an unintended repository or commit.
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
 * Git pathspecs that restore the repository tree while preserving operator-owned paths.
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
      PROTECTED_ROOTS.some((root) => normalized === root || normalized.startsWith(`${root}/`))
    ) {
      throw new Error(`보호 경로가 복구 변경에 포함되어 있습니다: ${path}`);
    }

    return normalized;
  });

  return [...new Set(normalizedPaths)];
}
