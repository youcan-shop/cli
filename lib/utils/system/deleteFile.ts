import fs from 'fs';

/**
 * @param filePath - The path of the file to delete.
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
