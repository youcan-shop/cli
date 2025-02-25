import process from 'node:process';
import { ENV_VARS } from '@/internal/node/constants';

export function isDevelopment(env = process.env): boolean {
  return env[ENV_VARS.ENV] === 'development';
}
