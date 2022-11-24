import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

/**
 * Zip folder and save it to a given path and return zip folder path
 * @param folderPath
 * @param folderName
 */
export default async function zipFolder(folderPath: string, folderName: string): Promise<string> {
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

