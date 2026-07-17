/**
 * esdkaiyuan email verification service.
 *
 * Contract (discovered from the admin SPA):
 *   POST {base}/send-code    { email }        → { success, message }
 *   POST {base}/verify-code  { email, code }  → { success, message }
 *   Auth: X-API-Key header. Rate limit: 30 req/min.
 *
 * The service does not allow arbitrary browser origins, so in dev requests
 * go through the Vite proxy at /mailapi (see vite.config.ts). In production
 * keep the same /mailapi prefix behind your reverse proxy.
 */

const API_KEY = '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';
const BASE = '/mailapi';

export interface MailApiResult {
  success: boolean;
  message: string;
}

async function post(path: string, body: unknown): Promise<MailApiResult> {
  try {
    const res = await fetch(BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
      body: JSON.stringify(body)
    });
    const data = (await res.json().catch(() => ({}))) as Partial<MailApiResult>;
    return {
      success: Boolean(data.success),
      message: typeof data.message === 'string' ? data.message : res.ok ? '' : `HTTP ${res.status}`
    };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  }
}

export function sendVerifyCode(email: string): Promise<MailApiResult> {
  return post('/send-code', { email });
}

export function verifyEmailCode(email: string, code: string): Promise<MailApiResult> {
  return post('/verify-code', { email, code });
}
