import fs from 'fs';
import path, { resolve } from 'path';
import archiver from 'archiver';
import { lsDir } from './ls';
/**
 * Zip folder and save it to a given path and return zip folder path
 */
export async function zipFolder(folderPath: string, folderName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const zipPath = path.resolve(folderPath, `${folderName}.zip`);
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', {
        zlib: { level: 9 },
      });

      output.on('close', () => {
        resolve(zipPath);
      });
      archive.on('error', (err: any) => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(path.resolve(folderPath, folderName), false);
      archive.finalize();
    }
    catch (err) {
      reject(err);
    }
  });
}

export async function zipDirectory(dirPath: string, folderName: string) {
  const ls = lsDir(dirPath);

  return new Promise((resolve, reject) => {
    try {
      const zip = path.resolve(dirPath, `${folderName}.zip`);
      const output = fs.createWriteStream(zip);
      const archive = archiver('zip', {
        zlib: { level: 9 },
      });

      output.on('close', () => {
        resolve(zip);
      });
      archive.on('error', (err: any) => {
        reject(err);
      });

      archive.pipe(output);
      ls.forEach(folder => archive.directory(path.resolve(dirPath, folder), folder));
      archive.finalize();
    }
    catch (err) {
      reject(err);
    }
  });
}

