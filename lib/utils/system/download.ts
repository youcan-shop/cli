import fs from 'fs';
import fetch from 'node-fetch';

export async function downloadFile(url: string, filename: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    headers,
  });
  await new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(filename);
    res?.body?.pipe(fileStream);
    res?.body?.on('error', (err) => {
      reject(err);
    });
    fileStream.on('finish', () => {
      resolve(true);
    });
  });
}

