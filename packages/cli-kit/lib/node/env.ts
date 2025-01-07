import process from 'node:process';
import { ENV_VARS } from '@/internal/node/constants';

export function get(key: keyof typeof ENV_VARS) {
  return process.env[ENV_VARS[key]]!;
}

export function oauthClientId(): string {
  switch (get('HOST_ENV')) {
    case 'dev':
      return '1';
    case 'test':
      return '11';
    case 'prod':
    default:
      return '398';
  }
}

export function sellerAreaHostname(): string {
  switch (get('HOST_ENV')) {
    case 'dev':
      return 'seller-area.dotshop.com';
    case 'test':
      return 'seller-area.testyoucan.shop';
    case 'prod':
    default:
      return 'seller-area.youcan.shop';
  }
}

export function apiHostname(): string {
  switch (get('HOST_ENV')) {
    case 'dev':
      return 'api.dotshop.com';
    case 'test':
      return 'api.testyoucan.shop';
    case 'prod':
    default:
      return 'api.youcan.shop';
  }
}
