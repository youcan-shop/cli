import type { App, Extension, ExtensionMetadata } from '@/types';
import { Env, Filesystem, Http, Path } from '@youcan/cli-kit';
import { APP_CONFIG_FILENAME } from '@/constants';

export async function ensureExtensionIds(app: App): Promise<void> {
  const ids: Record<string, string> = { ...app.config.extension_ids };
  const legacy = app.configFilename === APP_CONFIG_FILENAME;

  for (const extension of app.extensions) {
    const handle = extensionHandle(extension);
    let id = ids[handle] ?? (legacy ? extension.config.id as string | undefined : undefined);

    if (!id) {
      const res = await Http.post<{ id: string; metadata: ExtensionMetadata }>(
        `${Env.apiHostname()}/apps/${app.config.id}/extensions/create`,
        { body: JSON.stringify({ ...extension.config, id: undefined }) },
      );

      id = res.id;
    }

    extension.config.id = id;
    ids[handle] = id;
  }

  if (JSON.stringify(ids) === JSON.stringify(app.config.extension_ids ?? {})) {
    return;
  }

  app.config.extension_ids = ids;

  const path = Path.join(app.root, app.configFilename);
  const disk = await Filesystem.readJsonFile<Record<string, unknown>>(path);

  await Filesystem.writeJsonFile(path, { ...disk, extension_ids: ids });
}

function extensionHandle(extension: Extension): string {
  return (extension.config.handle as string | undefined) ?? Path.basename(extension.root);
}
