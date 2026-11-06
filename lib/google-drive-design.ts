import { PlanError } from './google-drive-plan';

const FILES = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const TAG = 'district-design-v1';
export type DriveDesign = { id: string; name: string; modifiedTime: string };
const headers = (token: string) => ({ Authorization: `Bearer ${token}` });

function check(response: Response) {
  if (response.status === 401) throw new PlanError('permission-expired');
  if (!response.ok) throw new PlanError('drive-design-failed');
}

/** Create a new JSON design in the signed-in user’s Drive. */
export async function saveDriveDesign(token: string, name: string, json: string, fetcher: typeof fetch = fetch) {
  const boundary = `district_${crypto.randomUUID().replaceAll('-', '')}`;
  const metadata = { name, mimeType: 'application/json', appProperties: { studioDesign: TAG } };
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${json}\r\n--${boundary}--\r\n`,
  ]);
  const response = await fetcher(`${UPLOAD}?uploadType=multipart&fields=id,name`, {
    method: 'POST', headers: { ...headers(token), 'Content-Type': `multipart/related; boundary=${boundary}` }, body, signal: AbortSignal.timeout(60000),
  });
  check(response);
  const file = await response.json() as { id?: string };
  if (!file.id || !/^[\w-]+$/.test(file.id)) throw new PlanError('drive-design-failed');
  return file.id;
}

/** Replace only the content of the selected app-created file. */
export async function updateDriveDesign(token: string, id: string, json: string, fetcher: typeof fetch = fetch) {
  if (!/^[\w-]+$/.test(id)) throw new PlanError('drive-design-failed');
  const response = await fetcher(`${UPLOAD}/${id}?uploadType=media&fields=id`, {
    method: 'PATCH', headers: { ...headers(token), 'Content-Type': 'application/json; charset=UTF-8' }, body: json, signal: AbortSignal.timeout(60000),
  });
  check(response);
  const result = await response.json() as { id?: string };
  if (result.id !== id) throw new PlanError('drive-design-failed');
}


/** Only app-created designs are listed under the existing drive.file grant. */
export async function listDriveDesigns(token: string, fetcher: typeof fetch = fetch): Promise<DriveDesign[]> {
  const files: DriveDesign[] = [];
  let pageToken = '';
  do {
    const params = new URLSearchParams({ q: `trashed = false and mimeType = 'application/json' and appProperties has { key='studioDesign' and value='${TAG}' }`, fields: 'nextPageToken,files(id,name,modifiedTime)', orderBy: 'modifiedTime desc', pageSize: '100' });
    if (pageToken) params.set('pageToken', pageToken);
    const response = await fetcher(`${FILES}?${params}`, { headers: headers(token), signal: AbortSignal.timeout(20000) });
    check(response);
    const data = await response.json() as { nextPageToken?: string; files?: DriveDesign[] };
    files.push(...(data.files ?? []).filter(f => /^[\w-]+$/.test(f.id) && typeof f.name === 'string'));
    pageToken = data.nextPageToken ?? '';
  } while (pageToken);
  return files;
}

export async function readDriveDesign(token: string, id: string, fetcher: typeof fetch = fetch): Promise<File> {
  if (!/^[\w-]+$/.test(id)) throw new PlanError('drive-design-failed');
  const response = await fetcher(`${FILES}/${id}?alt=media`, { headers: headers(token), signal: AbortSignal.timeout(20000) });
  check(response);
  if (Number(response.headers.get('content-length')) > 2_000_000) throw new PlanError('drive-design-failed');
  const blob = await response.blob();
  if (blob.size > 2_000_000) throw new PlanError('drive-design-failed');
  return new File([blob], 'design.json', { type: 'application/json' });
}
