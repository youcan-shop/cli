import { homedir } from 'os';
import path from 'path';

export default {
  OAUTH_CLIENT_ID: 8,
  OAUTH_CALLBACK_PORT: 3_000,
  OAUTH_CALLBACK_SERVER_TIMEOUT: 5 * 60 * 100,
  OAUTH_CALLBACK_URL: 'http://localhost:3000/',
  OAUTH_CLIENT_SECRET: 'lvUw2mQ7nXp4WqZ9CZlURMgRGAra3KuOrYhFlU7X',
  OAUTH_AUTH_CODE_URL: 'https://seller-area.youcan.shop/admin/oauth/authorize?response_type=code&client_id=8&redirect_url=http://localhost:3000/&state=',
  OAUTH_ACCESS_TOKEN_URL: 'https://seller-area.youcan.shop/admin/oauth/token',

  SELLER_AREA_API_BASE_URI: 'https://api.youcan.shop',
  SELLER_AREA_WEB_BASE_URI: 'https://seller-area.youcan.shop',

  STARTER_THEME_GIT_REPOSITORY: 'https://github.com/youcan-shop/light-theme.git',
  AVAILABLE_THEMES: [
    { name: 'default', repository: 'https://github.com/youcan-shop/light-theme.git' },
    { name: 'cod-theme', repository: 'https://github.com/youcan-shop/cod-theme.git' },
  ],

  CLI_GLOBAL_CONFIG_DIR: path.resolve(homedir(), '.youcan'),
  CLI_GLOBAL_CONFIG_PATH: path.resolve(homedir(), '.youcan', 'config.json'),

  THEME_FILE_TYPES: ['layouts', 'sections', 'locales', 'assets', 'snippets', 'config', 'templates'],

  PREVIEW_SERVER_PORT: 7565,
};