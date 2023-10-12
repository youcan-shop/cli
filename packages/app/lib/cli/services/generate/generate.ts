import { Filesystem, Git, Path, String } from '@youcan/cli-kit';
import type { ExtensionFlavor, ExtensionTemplateType, InitialAppConfig } from '@/types';

export async function ensureExtensionDirectoryExists(name: string) {
  const hyphenized = String.hyphenate(name);
  const dir = Path.join(Path.cwd(), 'extensions', hyphenized);

  if (await Filesystem.exists(dir)) {
    throw new Error(`The '${hyphenized}' already exists, choose a new name for your extension`);
  }

  await Filesystem.mkdir(dir);

  return dir;
}

export interface InitExtensionOptions {
  name: string
  app: InitialAppConfig
  directory: string
  type: ExtensionTemplateType
  flavor?: ExtensionFlavor
}

export async function initThemeExtension(options: InitExtensionOptions) {
  return Filesystem.tapIntoTmp(async (tmp) => {
    const directory = Path.join(tmp, 'download');
    await Filesystem.mkdir(directory);

    await Git.clone({
      url: options.type.url,
      destination: directory,
      shallow: true,
    });

    const flavorPath = Path.join(directory, options.flavor?.path || '');
    if (!await Filesystem.exists(flavorPath)) {
      throw new Error(`Extension flavor '${options.flavor?.name}' is unavailble`);
    }

    await Filesystem.move(flavorPath, options.directory, { overwrite: true });

    await Filesystem.writeJsonFile(Path.join(directory, 'youcan.extensions.json'), {
      name: options.name,
      type: options.type.type,
    });
  });
}
