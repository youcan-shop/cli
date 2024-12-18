import FilesystemPromises from 'fs/promises';
import type { Mode, OpenMode, PathLike, Stats } from 'fs';
import { createGunzip } from 'zlib';
import { pipeline } from 'node:stream/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { temporaryDirectoryTask } from 'tempy';
import FsExtra from 'fs-extra';
import archiver from 'archiver';
import chokidar from 'chokidar';
import type { GlobOptions } from 'glob';
import { glob as _glob } from 'glob';

import * as tar from 'tar';
import { Path } from '..';

export async function exists(path: string): Promise<boolean> {
  try {
    await FilesystemPromises.access(path);

    return true;
  }
  catch {
    return false;
  }
}

export async function isExecutable(path: string) {
  if (!await exists(path)) {
    return false;
  }

  try {
    await FilesystemPromises.access(path, FilesystemPromises.constants.X_OK);

    return true;
  }
  catch {
    return false;
  }
}

export async function isDirectory(path: string): Promise<boolean> {
  try {
    const stats: Stats = await FilesystemPromises.stat(path);

    return stats.isDirectory();
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

export async function rm(path: string): Promise<void> {
  await FilesystemPromises.rm(path, { recursive: true });
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
  const content = await readFile(path, { encoding: 'utf8' }) as string;

  return JSON.parse(content);
}

export async function writeJsonFile(path: PathLike, data: Record<string, unknown>): Promise<void> {
  return writeFile(path, JSON.stringify(data, null, 4));
}

export async function glob(
  pattern: string | string[],
  options?: GlobOptions,
): Promise<string[]> {
  let _options = options;
  if (options?.dot == null) {
    _options = { ...options, dot: true };
  }

  return _glob.glob(pattern, _options || {}) as Promise<string[]>;
}

export async function archived(path: string, name: string, glob = '**/*'): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const archivePath = Path.resolve(path, `${name}.zip`);

      const output = createWriteStream(archivePath);
      const _archiver = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve(archivePath));

      _archiver.on(
        'error',
        () => (err: unknown) => reject(err),
      );

      _archiver.pipe(output);

      _archiver.glob(glob, {
        ignore: [`${name}.zip`],
        cwd: path,
      });

      _archiver.finalize();
    }
    catch (err) {
      reject(err);
    }
  });
}

export async function unlink(path: string): Promise<void> {
  if (await exists(path)) {
    await FilesystemPromises.unlink(path);
  }
}

export async function readdir(path: string) {
  return await FilesystemPromises.readdir(path);
}

export async function stat(path: string): Promise<Stats> {
  return await FilesystemPromises.stat(path);
}

export const watch = chokidar.watch;

export async function decompress(file: string, destination: string, mode = 0o777) {
  const unzip = createGunzip();
  const readStream = createReadStream(file);
  const writeStream = createWriteStream(destination, { mode });

  await pipeline(readStream, unzip, writeStream);
}

export async function extractTar(file: string, cwd: string) {
  await tar.extract({ cwd, file });
}
