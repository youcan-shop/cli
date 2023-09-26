import FilesystemPromises from 'fs/promises';
import { temporaryDirectoryTask } from 'tempy';

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
