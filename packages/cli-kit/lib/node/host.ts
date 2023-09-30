import { ENV_VARS } from '@/internal/node/constants';

export enum ENV {
  DEV = 'dev',
  TEST = 'test',
  PROD = 'prod',
}

export function getHostEnvironment(): string {
  return ENV[ENV_VARS.HOST_ENV as keyof typeof ENV];
}

export function getSellerAreaHostname(): string {
  switch (getHostEnvironment()) {
    case ENV.DEV:
      return 'seller-area.dotshop.com';
    case ENV.PROD:
      return 'seller-area.youcan.shop';
    case ENV.TEST:
      return 'seller-area.testyoucan.shop';

    default:
      throw new Error('non exhaustive handling of envs');
  }
}
