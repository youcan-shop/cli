import os from 'os';
import type { PathLike } from 'fs';
import fs from 'fs';
import path from 'path';
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

export async function getCurrentThemeId(dir: PathLike): Promise<string> {
  const filepath = path.resolve(dir.toString(), '.youcan');

  if (!fs.existsSync(filepath))
    throw new Error('No theme detected in the current directory');

  return await fs.promises.readFile(filepath, 'utf-8')
    .then(b => JSON.parse(b).theme_id);
}

