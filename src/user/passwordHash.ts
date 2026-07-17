/**
 * Password hashing for the client-side account store.
 * SHA-256(salt:password) via WebCrypto, with a small deterministic FNV-1a
 * fallback for runtimes without crypto.subtle (older test environments).
 */

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (const b of bytes) out += b.toString(16).padStart(2, '0');
  return out;
}

export function randomSalt(): string {
  const bytes = new Uint8Array(16);
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.getRandomValues) cryptoObj.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return bytesToHex(bytes);
}

function fnv1a(input: string, seed: number): number {
  let hash = seed >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const material = `${salt}:${password}`;
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const digest = await subtle.digest('SHA-256', new TextEncoder().encode(material));
    return bytesToHex(new Uint8Array(digest));
  }
  let out = '';
  for (const seed of [0x811c9dc5, 0xdeadbeef, 0xcafebabe, 0x9e3779b9]) {
    out += fnv1a(material, seed).toString(16).padStart(8, '0');
  }
  return out;
}
