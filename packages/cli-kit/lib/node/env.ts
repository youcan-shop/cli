import { ENV_VARS } from '@/internal/node/constants';

export function get(key: keyof typeof ENV_VARS) {
  return process.env[ENV_VARS[key]]!;
}

export function oauthClientId(): string {
  switch (get('HOST_ENV')) {
    case 'dev':
      return '3';
    case 'test':
      return '8';
    case 'prod':
    default:
      return '8';
  }
}

export function oauthClientSecret(): string {
  switch (get('HOST_ENV')) {
    case 'dev':
      return 'kvvtjXFCeuvvNX2nwD30SAfh7DMbVXm16E0MPCTu';
    case 'test':
      return '8';
    case 'prod':
    default:
      return 'lvUw2mQ7nXp4WqZ9CZlURMgRGAra3KuOrYhFlU7X';
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
