import fs from 'fs';

/**
 * @param filePath - The path to the file to write to.
 * @param content - The content to write to the file.
 * @returns A promise that resolves when the file has been written.
*/

export default function writeToFile(filePath: string, content: string) {
  return new Promise<void>((resolve, reject) => {
    try {
      fs.writeFileSync(filePath, content, { encoding: 'utf8' });
      return resolve();
    }
    catch (error) {
      return reject(error);
    }
  });
}
