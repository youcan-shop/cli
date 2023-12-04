import { paramCase } from 'change-case';

export function hyphenate(value: string): string {
  return paramCase(value);
}

export function isJson(subject: string) {
  try {
    JSON.parse(subject);

    return true;
  }
  catch (err) {
    return false;
  }
}
