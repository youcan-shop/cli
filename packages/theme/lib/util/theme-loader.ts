import { Filesystem, Path } from '@youcan/cli-kit';
import { THEME_CONFIG_FILENAME } from '@/constants';

export async function load() {
  const path = Path.resolve(Path.cwd(), THEME_CONFIG_FILENAME);
  if (!await Filesystem.exists(path)) {
    throw new Error(`Theme config not found at ${path}`);
  }

  return await Filesystem.readJsonFile<{ id: string }>(path);
}
