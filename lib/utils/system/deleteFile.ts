import fs from 'fs';

/**
 * @param filePath - The path of the file to delete.
 *
*/
export default function deleteFile(filePath: string) {
  if (fs.existsSync(filePath))
    fs.unlinkSync(filePath);
}
