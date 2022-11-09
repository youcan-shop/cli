import fs from 'fs';

/**
 * @param filePath - The path to the file to write to.
*/

export default function deleteFile(filePath: string) {
  return new Promise<void>((resolve, reject) => {
    try {
      if (fs.existsSync(filePath))
        fs.unlinkSync(filePath);
      return resolve();
    }
    catch (error) {
      return reject(error);
    }
  });
}
