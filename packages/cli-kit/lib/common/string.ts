import { paramCase } from 'change-case';

export function hyphenate(value: string): string {
  return paramCase(value);
}
