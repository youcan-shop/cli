import type { App, ExtensionMetadata } from '@/types';
import { Env, Filesystem, Http, Path } from '@youcan/cli-kit';
import { EXTENSION_CONFIG_FILENAME } from '@/constants';

export async function ensureExtensionIds(app: App): Promise<void> {
  for (const extension of app.extensions) {
    if (extension.config.id) {
      continue;
    }

    const res = await Http.post<{ id: string; metadata: ExtensionMetadata }>(
      `${Env.apiHostname()}/apps/${app.config.id}/extensions/create`,
      { body: JSON.stringify({ ...extension.config }) },
    );

    extension.config.id = res.id;

    await Filesystem.writeJsonFile(
      Path.join(extension.root, EXTENSION_CONFIG_FILENAME),
      { ...extension.config },
    );
  }
}
