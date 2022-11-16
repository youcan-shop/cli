import fs from 'fs';
import { pipeline } from 'stream/promises';

export async function saveHttpFile(res: any, filename: string) {
  const fileStream = fs.createWriteStream(filename);
  return await pipeline(res.body, fileStream);
}

