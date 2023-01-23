import { readdirSync, statSync } from 'fs';

export function lsDir(path: string): string[] {
  return readdirSync(path).filter((file: string) => {
    return statSync(`${path}/${file}`).isDirectory() && file[0] !== '.';
  });
}
