import { pathToFileURL } from "node:url";
export const PREVIEW_BASE_URL =
  "https://kwater-prize-draw-preview-pdo89plnz-week1profile.vercel.app";
export const EXPECTED_PROJECT_REF = "xmrezoudkgktbtfmzxhu";
export const EXPECTED_EVENT_ID = "6833f277-746c-4033-9aef-30016cbba712";
export const EXPIRY = "2026-10-28T00:00:00+09:00";
export const REQUIRED_ENV_NAMES = [
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_PROJECT_ID",
];
export const isExpired = (now = new Date()) =>
  now.getTime() >= new Date(EXPIRY).getTime();
async function json(r, label) {
  if (!r.ok) throw Error(`${label} HTTP ${r.status}`);
  return r.json();
}
export async function checkPreview(fetcher = fetch) {
  for (const [path, label, phrase] of [
    ["/", "participant", "경품"],
    ["/display", "display", "관리자"],
    ["/admin", "admin", "관리자"],
  ]) {
    const r = await fetcher(`${PREVIEW_BASE_URL}${path}`);
    if (!r.ok) throw Error(`${label} HTTP ${r.status}`);
    if (!(await r.text()).includes(phrase))
      throw Error(`${label} 기본 문구 확인 실패`);
  }
  const e = await json(
    await fetcher(`${PREVIEW_BASE_URL}/api/public/event`),
    "public event",
  );
  if (e.id !== EXPECTED_EVENT_ID) throw Error("공개 행사 ID 불일치");
  if (typeof e.status !== "string") throw Error("공개 행사 상태 누락");
  return { eventStatus: e.status };
}
export async function checkSupabase(fetcher = fetch, env = process.env) {
  for (const n of REQUIRED_ENV_NAMES)
    if (!env[n]) throw Error(`필수 GitHub Secret 누락: ${n}`);
  if (env.SUPABASE_PROJECT_ID !== EXPECTED_PROJECT_REF)
    throw Error("Supabase project ref 불일치");
  const headers = {
    Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
  const p = await json(
    await fetcher(
      `https://api.supabase.com/v1/projects/${EXPECTED_PROJECT_REF}`,
      { headers },
    ),
    "Supabase project",
  );
  if ((p.id ?? p.ref) !== EXPECTED_PROJECT_REF)
    throw Error("Supabase project 응답 ref 불일치");
  const status = String(p.status ?? p.health ?? "").toUpperCase();
  if (!["ACTIVE", "ACTIVE_HEALTHY"].includes(status))
    throw Error(`Supabase project 상태 비정상: ${status || "unknown"}`);
  const query = `select id, status from public.events where id = '${EXPECTED_EVENT_ID}' limit 1;`;
  const rows = await json(
    await fetcher(
      `https://api.supabase.com/v1/projects/${EXPECTED_PROJECT_REF}/database/query/read-only`,
      { method: "POST", headers, body: JSON.stringify({ query }) },
    ),
    "Supabase event query",
  );
  const e = Array.isArray(rows)
    ? rows[0]
    : (rows?.result?.[0] ?? rows?.data?.[0]);
  if (!e || e.id !== EXPECTED_EVENT_ID || typeof e.status !== "string")
    throw Error("Supabase 행사 조회 실패");
  return { projectStatus: status, eventStatus: e.status };
}
export async function main() {
  if (isExpired()) {
    console.log("Preview availability monitor expired; skipping checks.");
    return;
  }
  const p = await checkPreview();
  const s = await checkSupabase();
  console.log(
    `Preview availability OK: event=${p.eventStatus}, Supabase=${s.projectStatus}, event=${s.eventStatus}`,
  );
}
if (import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
