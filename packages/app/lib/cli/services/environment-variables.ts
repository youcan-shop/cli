import type { App } from '@/types';
import { Env } from '@youcan/cli-kit';

export function getAppEnvironmentVariables(app: App): Record<string, string> {
  if (!app.remote_config) {
    throw new Error('remote app config not loaded');
  }

  return {
    YOUCAN_API_KEY: app.remote_config.client_id,
    YOUCAN_API_SECRET: app.remote_config.client_secret,
    YOUCAN_API_SCOPES: app.remote_config.scopes.join(','),
    YOUCAN_API_URL: `https://${Env.apiHostname()}`,
    YOUCAN_SELLER_AREA_URL: `https://${Env.sellerAreaHostname()}`,
  };
}
