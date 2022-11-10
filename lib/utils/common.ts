import os from 'os';
import fs from 'fs';
export const homeDir = os.homedir();

/**
 * Get youcan token from $HOME/.youcan file
 * @returns string - youcan token
 */
export async function getUserToken(): Promise<string> {
  const filePath = `${homeDir}/.youcan`;
  const data = await fs.promises.readFile(filePath, 'utf8');
  if (!data) throw new Error('Token not found please login first.');
  const token = data.split('=')[1];
  return token;
}
