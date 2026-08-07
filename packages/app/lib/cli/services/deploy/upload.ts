import type { App, Blob } from '@/types';
import { Env, Form, Http } from '@youcan/cli-kit';

export async function uploadMissingBlobs(app: App, blobs: Blob[]): Promise<number> {
  const unique = [...new Map(blobs.map(b => [`${b.type}:${b.hash}`, b])).values()];
  if (!unique.length) {
    return 0;
  }

  const { missing } = await Http.post<{ missing: Array<{ type: string; hash: string }> }>(
    `${Env.apiHostname()}/apps/${app.config.id}/files/check`,
    { body: JSON.stringify({ files: unique.map(({ type, hash }) => ({ type, hash })) }) },
  );

  for (const { type, hash } of missing) {
    const blob = unique.find(b => b.type === type && b.hash === hash)!;

    await Http.post(`${Env.apiHostname()}/apps/${app.config.id}/files`, {
      body: Form.convert({ type, hash, content: await Form.file(blob.path) }),
    });
  }

  return missing.length;
}
