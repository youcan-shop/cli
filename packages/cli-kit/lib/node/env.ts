import { ENV_VARS } from '@/internal/node/constants';

export function get(key: keyof typeof ENV_VARS) {
  return process.env[ENV_VARS[key]]!;
}

export function oauthClientId(): string {
  switch (get('HOST_ENV')) {
    case 'dev':
      return '1';
    case 'test':
      return '8';
    case 'prod':
      return '8';

    default:
      throw new Error('non-exhaustive handling of envs');
  }
}

export function sellerAreaHostname(): string {
  switch (get('HOST_ENV')) {
    case 'dev':
      return 'seller-area.dotshop.com';
    case 'prod':
      return 'seller-area.youcan.shop';
    case 'test':
      return 'seller-area.testyoucan.shop';

    default:
      throw new Error('non exhaustive handling of envs');
  }
}

export function apiHostname(): string {
  switch (get('HOST_ENV')) {
    case 'dev':
      return 'api.dotshop.com';
    case 'prod':
      return 'api.youcan.shop';
    case 'test':
      return 'api.testyoucan.shop';

    default:
      throw new Error('non exhaustive handling of envs');
  }
}
