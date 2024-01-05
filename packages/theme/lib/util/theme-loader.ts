import { Filesystem, Path } from '@youcan/cli-kit';
import { THEME_CONFIG_FILENAME } from '@/constants';
import type { Theme } from '@/types';

export async function load(): Promise<Theme> {
  const path = Path.resolve(Path.cwd(), THEME_CONFIG_FILENAME);
  if (!await Filesystem.exists(path)) {
    throw new Error(`Theme config not found at ${path}`);
  }

  const config = await Filesystem.readJsonFile<{ theme_id: string }>(path);

  return {
    ...config,
    root: Path.cwd(),
  };
}
