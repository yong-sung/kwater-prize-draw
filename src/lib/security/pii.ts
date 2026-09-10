import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";

const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function decodeEncryptionKey(keyBase64: string): Buffer {
  const key = Buffer.from(keyBase64, "base64");
  if (key.length !== KEY_LENGTH) {
    throw new Error("PII_ENCRYPTION_KEY는 32바이트여야 합니다");
  }
  return key;
}

export function encryptPii(plain: string, keyBase64: string): string {
  const key = decodeEncryptionKey(keyBase64);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);

  return [iv, cipher.getAuthTag(), encrypted]
    .map((part) => part.toString("base64url"))
    .join(".");
}

export function decryptPii(value: string, keyBase64: string): string {
  const key = decodeEncryptionKey(keyBase64);
  const parts = value.split(".");

  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    throw new Error("암호문 형식이 올바르지 않습니다");
  }

  const [iv, tag, encrypted] = parts.map((part) =>
    Buffer.from(part, "base64url"),
  );
  if (iv.length !== IV_LENGTH || tag.length !== AUTH_TAG_LENGTH) {
    throw new Error("암호문 형식이 올바르지 않습니다");
  }

  try {
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("개인정보를 복호화할 수 없습니다");
  }
}

function hmac(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function hashPhone(phone: string, secret: string): string {
  return hmac(phone, secret);
}

export function hashAccessToken(token: string, secret: string): string {
  return hmac(token, secret);
}
