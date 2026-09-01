import type { App, AppConfig, Extension, ExtensionConfig, Web, WebConfig } from '@/types';
import { Filesystem, Path } from '@youcan/cli-kit';
import { appConfigFilename, DEFAULT_EXTENSIONS_DIR, DEFAULT_WEBS_DIR, EXTENSION_CONFIG_FILENAME, WEB_CONFIG_FILENAME } from '@/constants';

export async function load(env?: string) {
  const filename = appConfigFilename(env);

  const path = Path.resolve(Path.cwd(), filename);
  if (!await Filesystem.exists(path)) {
    throw new Error(env
      ? `app config not found at ${path}, run \`youcan app config link ${env}\` to create it`
      : `app config not found at ${path}`);
  }

  const config = await Filesystem.readJsonFile<AppConfig>(path);

  const app: App = {
    config,
    configFilename: filename,
    webs: [],
    extensions: [],
    root: Path.cwd(),
  };

  app.extensions = await loadExtensions(app);
  app.webs = await loadWebs(app);

  return app;
}

async function loadExtensions(app: App): Promise<Extension[]> {
  const pattern = Path.join(
    app.root,
    `${DEFAULT_EXTENSIONS_DIR}/*`,
    EXTENSION_CONFIG_FILENAME,
  );

  const paths = await Filesystem.glob(pattern);

  const promises = paths.map(async (p) => {
    return {
      root: Path.dirname(p),
      config: await Filesystem.readJsonFile<ExtensionConfig>(p),
    } as Extension;
  });

  return await Promise.all(promises);
}

async function loadWebs(app: App): Promise<Web[]> {
  const pattern = Path.join(app.root, DEFAULT_WEBS_DIR, WEB_CONFIG_FILENAME);
  const paths = await Filesystem.glob(pattern);

  const promises = paths.map(async p => ({
    root: Path.dirname(p),
    config: await Filesystem.readJsonFile<WebConfig>(p),
  }));

  return await Promise.all(promises);
}
