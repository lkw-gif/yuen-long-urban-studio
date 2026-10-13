const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DOMAIN = 'keilong.edu.hk';
export const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const GOOGLE_DOC_MIME = 'application/vnd.google-apps.document';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,mimeType,webViewLink';
const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files';

type TokenResponse = { access_token?: string; scope?: string; error?: string; hd?: string };
export type GoogleOAuth2 = {
  initTokenClient: (options: {
    client_id: string; scope: string; include_granted_scopes: boolean; prompt: string;
    login_hint: string; hd: string;
    callback: (response: TokenResponse) => void;
    error_callback: (error: { type: string }) => void;
  }) => { requestAccessToken: () => void };
};
export type OnlinePlan = { id: string; url: string };
export class PlanError extends Error {
  constructor(public code: string) { super(code); this.name = 'PlanError'; }
}
export function isSchoolEmail(value: string) {
  return /^[^\s@]+@keilong\.edu\.hk$/i.test(value);
}

/** Call directly from the student's click so Google's popup has user activation. */
export function requestPlanAccess(email: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
    if (!isSchoolEmail(email)) return reject(new PlanError('school-account'));
    if (!clientId) return reject(new PlanError('missing-client'));
    const oauth = window.google?.accounts.oauth2;
    if (!oauth) return reject(new PlanError('google-loading'));
    const client = oauth.initTokenClient({
      client_id: clientId, scope: `openid email ${DRIVE_SCOPE}`, include_granted_scopes: false,
      prompt: '', login_hint: email, hd: DOMAIN,
      callback: response => {
        if (response.error || !response.access_token) return reject(new PlanError('permission-denied'));
        if (!(response.scope ?? '').split(/\s+/).includes(DRIVE_SCOPE)) return reject(new PlanError('permission-denied'));
        resolve(response.access_token);
      },
      error_callback: error => reject(new PlanError(error.type === 'popup_failed_to_open' ? 'popup-blocked' : 'popup-closed')),
    });
    client.requestAccessToken();
  });
}

/** Verify the authorized Google account matches the account admitted by the school gate. */
export async function checkPlanAccount(token: string, expectedEmail: string, fetcher: typeof fetch = fetch) {
  const response = await fetcher('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new PlanError('account-check');
  const profile = await response.json() as { email?: string; email_verified?: boolean; hd?: string };
  if (!isSchoolEmail(profile.email ?? '') || profile.email_verified !== true ||
      profile.hd?.toLowerCase() !== DOMAIN || profile.email?.toLowerCase() !== expectedEmail.toLowerCase()) {
    throw new PlanError('school-account');
  }
}
function parseOnlinePlan(file: { id?: string; mimeType?: string; webViewLink?: string }): OnlinePlan {
  if (!file.id || !/^[a-zA-Z0-9_-]+$/.test(file.id) || file.mimeType !== GOOGLE_DOC_MIME || !file.webViewLink) throw new PlanError('conversion-failed');
  const url = new URL(file.webViewLink);
  if (url.protocol !== 'https:' || url.hostname !== 'docs.google.com' || !url.pathname.startsWith(`/document/d/${file.id}/`)) throw new PlanError('conversion-failed');
  return { id: file.id, url: file.webViewLink };
}
export function planUploadBody(bytes: Uint8Array, title: string, requestId: string) {
  const boundary = `studio_${crypto.randomUUID().replaceAll('-', '')}`;
  const metadata = { name: title, mimeType: GOOGLE_DOC_MIME, appProperties: { studioRequestId: requestId } };
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    `--${boundary}\r\nContent-Type: ${DOCX_MIME}\r\n\r\n`, new Uint8Array(bytes), `\r\n--${boundary}--\r\n`,
  ]);
  return { body, contentType: `multipart/related; boundary=${boundary}` };
}

/** Create a native, private Google Doc from the filled Word template. No broad Drive scope or client secret. */
export async function createOnlinePlan(token: string, bytes: Uint8Array, title: string, requestId: string, fetcher: typeof fetch = fetch): Promise<OnlinePlan> {
  if (!/^[a-zA-Z0-9-]{8,80}$/.test(requestId)) throw new PlanError('invalid-request');
  const headers = { Authorization: `Bearer ${token}` };
  // A retry reuses this ID so an interrupted conversion cannot create a second document.
  const query = `trashed = false and appProperties has { key='studioRequestId' and value='${requestId}' }`;
  const findExisting = async () => {
    const found = await fetcher(`${DRIVE_FILES}?q=${encodeURIComponent(query)}&fields=files(id,mimeType,webViewLink)&pageSize=1`, { headers, signal: AbortSignal.timeout(20000) });
    if (!found.ok) return null;
    const data = await found.json() as { files?: Array<{ id: string; mimeType: string; webViewLink: string }> };
    return data.files?.length ? parseOnlinePlan(data.files[0]) : null;
  };
  const existing = await findExisting();
  if (existing) return existing;
  const { body, contentType } = planUploadBody(bytes, title, requestId);
  let response: Response;
  try {
    response = await fetcher(DRIVE_UPLOAD, { method: 'POST', headers: { ...headers, 'Content-Type': contentType }, body, signal: AbortSignal.timeout(60000) });
  } catch {
    const recovered = await findExisting().catch(() => null);
    if (recovered) return recovered;
    throw new PlanError('network');
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { error?: { message?: string; errors?: Array<{ reason?: string }> } };
    const reason = error.error?.errors?.[0]?.reason ?? '';
    if (reason === 'accessNotConfigured' || /disabled|has not been used|SERVICE_DISABLED/i.test(error.error?.message ?? '')) throw new PlanError('drive-disabled');
    if (response.status === 401) throw new PlanError('permission-expired');
    if (reason === 'storageQuotaExceeded') throw new PlanError('storage-full');
    if (response.status === 403) throw new PlanError('school-policy');
    throw new PlanError('generation-failed');
  }
  return parseOnlinePlan(await response.json());
}
