import fs from 'fs';

/**
 * deletes the file at the given path
 * @param filePath - The path of the file to delete.
*/
export default function deleteFile(filePath: string) {
  if (fs.existsSync(filePath))
    fs.unlinkSync(filePath);
}
