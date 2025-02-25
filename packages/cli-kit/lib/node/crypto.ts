import type { Buffer } from 'node:buffer';
import type { BinaryLike } from 'node:crypto';
import crypto from 'node:crypto';

export function randomHex(size: number): string {
  return crypto.randomBytes(size).toString('hex');
}

export function base64URLEncode(str: Buffer): string {
  return str.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/[=]/g, '');
}

export function sha256(str: BinaryLike): Buffer {
  return crypto.createHash('sha256').update(str).digest();
}

export function sha1(str: BinaryLike): string {
  return crypto.createHash('sha1').update(str).digest('hex');
}

export function hashString(str: string): string {
  return crypto.createHash('sha1').update(str).digest('hex');
}

export function fileHash(buff: BinaryLike): string {
  return crypto.createHash('md5').update(buff).digest('hex');
}

export function randomBytes(size: number): Buffer {
  return crypto.randomBytes(size);
}

export function randomUUID(): string {
  return crypto.randomUUID();
}
