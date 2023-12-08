import crypto from 'crypto';

export function randomHex(size: number): string {
  return crypto.randomBytes(size).toString('hex');
}

export function base64URLEncode(str: Buffer): string {
  return str.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/[=]/g, '');
}

export function sha256(str: string): Buffer {
  return crypto.createHash('sha256').update(str).digest();
}

export function sha1(str: Buffer | string): string {
  return crypto.createHash('sha1').update(str).digest('hex');
}

export function hashString(str: string): string {
  return crypto.createHash('sha1').update(str).digest('hex');
}

export function fileHash(buff: Buffer): string {
  return crypto.createHash('md5').update(buff).digest('hex');
}

export function randomBytes(size: number): Buffer {
  return crypto.randomBytes(size);
}

export function randomUUID(): string {
  return crypto.randomUUID();
}
