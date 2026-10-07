export const EXPECTED_MIGRATION_FILES = Object.freeze([
  "20260910003438_initial.sql",
  "20260911114700_task3_review_fixes.sql",
  "20260911133000_task3_reveal_state_fix.sql",
  "20260911170000_admin_login_rate_limit.sql",
  "20260929003215_auditorium_rehearsal_reset.sql",
  "20260930090653_grouped_sequential_reveal.sql",
]);

export function assertExpectedMigrationFiles(actualFiles) {
  const matches =
    actualFiles.length === EXPECTED_MIGRATION_FILES.length &&
    actualFiles.every(
      (file, index) => file === EXPECTED_MIGRATION_FILES[index],
    );

  if (!matches) {
    throw new Error(
      `예상하지 못한 migration 목록: expected=${EXPECTED_MIGRATION_FILES.join(",")}; actual=${actualFiles.join(",")}`,
    );
  }

  return actualFiles;
}
