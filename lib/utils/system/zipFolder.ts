import fs from 'fs';
import archiver from 'archiver';
/**
 * Zip folder and save it to a given path and return zip folder path
 */
export default async function zipFolder(folderPath: string, folderName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const zipPath = `${folderPath}${folderName}.zip`;
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
      archive.directory(`${folderPath}${folderName}`, false);
      archive.finalize();
    }
    catch (err) {
      reject(err);
    }
  });
}

