import process from 'node:process';
import { ENV_VARS } from '@/internal/node/constants';

export function get(key: keyof typeof ENV_VARS) {
  return process.env[ENV_VARS[key]]!;
}

export function oauthClientId(): string {
  switch (get('HOST_ENV')) {
    case 'dev':
      return 'cl_3L4iBNamihyVyE7wZ9Nr23jIdLy';
    case 'test':
      return 'cl_3L4tSKG88SJ3mhwz8Toonx0pKPK';
    case 'prod':
    default:
      return 'cl_3L4jjE7uYRuKms0cmr3xsbGICLo';
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

export function idpHostname(): string {
  switch (get('HOST_ENV')) {
    case 'dev':
      return 'id.dotshop.com';
    case 'test':
      return 'accounts.testyoucan.shop';
    case 'prod':
    default:
      return 'accounts.youcan.shop';
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
