import { Filesystem, Path } from '@youcan/cli-kit';
import type { App, AppConfig, Extension, ExtensionConfig } from '@/types';
import { APP_CONFIG_FILENAME, DEFAULT_EXTENSIONS_DIR, EXTENSION_CONFIG_FILENAME } from '@/constants';

export async function load() {
  const path = Path.resolve(Path.cwd(), APP_CONFIG_FILENAME);
  if (!await Filesystem.exists) {
    throw new Error(`app config not found at ${path}`);
  }

  const config = await Filesystem.readJsonFile<AppConfig>(path);

  const app: App = {
    config,
    extensions: [],
    root: Path.cwd(),
  };

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

  app.extensions = await Promise.all(promises);

  return app;
}
