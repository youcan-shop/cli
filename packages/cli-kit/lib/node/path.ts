import path from 'path';

export function resolve(...paths: string[]): string {
  return path.resolve(...paths);
}

export function cwd(): string {
  return path.normalize(process.env.INIT_CWD ? process.env.INIT_CWD : process.cwd());
}

export function join(...paths: string[]): string {
  return path.join(...paths);
}

export function dirname(filepath: string) {
  return path.dirname(filepath);
}

export function basename(filepath: string) {
  return path.basename(filepath);
}
