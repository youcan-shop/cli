import { envvars } from '@/internal/node/constants';

export function isDevelopment(env = process.env): boolean {
  return env[envvars.env] === 'development';
}
