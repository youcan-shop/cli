import FilesystemPromises from 'fs/promises';
import type { Mode, OpenMode, PathLike } from 'fs';
import { temporaryDirectoryTask } from 'tempy';
import FsExtra from 'fs-extra';
import type { Options as GlobOptions, Pattern } from 'fast-glob';

export async function exists(path: string): Promise<boolean> {
  try {
    await FilesystemPromises.access(path);

    return true;
  }
  catch {
    return false;
  }
}

export async function tapIntoTmp<T>(callback: (tmp: string) => T | Promise<T>): Promise<T> {
  return temporaryDirectoryTask(callback);
}

export async function mkdir(path: string): Promise<void> {
  await FilesystemPromises.mkdir(path, { recursive: true });
}

interface MoveFileOptions {
  overwrite?: boolean
}

export async function move(src: string, dest: string, options: MoveFileOptions = {}): Promise<void> {
  await FsExtra.move(src, dest, options);
}

export async function readFile(
  path: PathLike,
  options: { encoding?: BufferEncoding; flag?: OpenMode } = { encoding: 'utf-8', flag: 'r' },
): Promise<Buffer | string> {
  return await FilesystemPromises.readFile(path, options);
}

export async function writeFile(
  path: PathLike,
  data: string,
  options: { encoding: BufferEncoding; flag: Mode } = { encoding: 'utf-8', flag: 'w' },
): Promise<void> {
  return await FilesystemPromises.writeFile(path, data, options);
}

export async function readJsonFile<T = Record<string, unknown>>(path: PathLike): Promise<T> {
  const file = await readFile(path);

  return JSON.parse(file instanceof Buffer ? file.toString() : file);
}

export async function writeJsonFile(path: PathLike, data: Record<string, unknown>): Promise<void> {
  return writeFile(path, JSON.stringify(data, null, 4));
}

export async function glob(
  pattern: Pattern | Pattern[],
  options?: GlobOptions,
): Promise<string[]> {
  const { default: _glob } = await import('fast-glob');

  let _options = options;
  if (options?.dot == null) {
    _options = { ...options, dot: true };
  }

  return _glob(pattern, _options);
}
