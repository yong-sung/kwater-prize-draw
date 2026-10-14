import { randomBytes } from "node:crypto";

const baseUrl =
  "https://kwater-prize-draw-preview-git-feat-auditori-055e6e-week1profile.vercel.app";
const count = Number(process.argv[2] ?? 60);
const apply = process.argv.includes("--apply");

if (!Number.isInteger(count) || count < 1 || count > 400) {
  console.error("인원수는 1~400 사이 정수로 입력하세요.");
  process.exit(1);
}

if (!apply) {
  console.log(`Preview에 테스트 참가자 ${count}명을 등록할 예정입니다.`);
  console.log("실제로 등록하려면 명령 끝에 --apply를 붙이세요.");
  process.exit(0);
}

let created = 0;
let duplicates = 0;
try {
  for (let index = 1; index <= count; index += 1) {
    const response = await fetch(`${baseUrl}/api/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        name: `테스트${String(index).padStart(3, "0")}`,
        department: `테스트부서${((index - 1) % 5) + 1}`,
        phone: `0100000${String(index).padStart(4, "0")}`,
        privacyConsent: true,
        accessToken: randomBytes(32).toString("base64url"),
      }),
    });
    const result = await response.json();
    if (response.ok) {
      created += 1;
    } else if (result.code === "DUPLICATE_PHONE") {
      duplicates += 1;
    } else if (result.code === "EVENT_CLOSED") {
      throw new Error(
        "응모가 마감되어 있습니다. 관리자 화면에서 행사 상태를 확인하세요.",
      );
    } else {
      throw new Error(`응모 API 오류 (HTTP ${response.status})`);
    }
    console.log(`${index}/${count} 처리 완료`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  console.log(`신규 등록 ${created}명 / 중복 건너뜀 ${duplicates}명`);
}
