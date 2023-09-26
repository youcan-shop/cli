import fs from 'fs';

export default function writeToFile(filePath: string, content: string): void {
  return fs.writeFileSync(filePath, content, { encoding: 'utf-8', flag: 'w' });
}
