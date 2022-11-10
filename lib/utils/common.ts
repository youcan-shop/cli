import os from 'os';
import fs from 'fs';
export const homeDir = os.homedir();

/**
 * Get youcan token from $HOME/.youcan file
 * @returns string - youcan token
 */
export async function getUserToken(): Promise<string> {
  const filePath = `${homeDir}/.youcan.json`;

  if (!fs.existsSync(filePath))
    throw new Error('You are not logged in. Please login first.');

  const data = await fs.promises.readFile(filePath, 'utf8');
  return JSON.parse(data).token;
}
