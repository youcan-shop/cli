import { homedir } from 'os';
import path from 'path';

export default {
  callbackServerPort: 3000,
  callbackServerTimeout: 10000,
  oauthClientId: '8',
  oauthClientSecret: 'lvUw2mQ7nXp4WqZ9CZlURMgRGAra3KuOrYhFlU7X',
  oauthRedirectUri: 'http://localhost:3000/',
  authorizationUrl: 'https://seller-area.youcan.shop/admin/oauth/authorize?response_type=code&client_id=8&redirect_url=http://localhost:3000/&state=',
  starterTheme: {
    themeRepository: 'git@github.com:NextmediaMa/funri.git',
    themeVersion: '1.0.0',
    themeSupportUrl: 'https://youcanpay.com',
    themeDocumentationUrl: 'https://youcanpay.com',
    themeAuthor: 'Azura',
    themeName: 'DevTheme',
  },

  OAUTH_CLIENT_ID: '2',
  OAUTH_CALLBACK_PORT: 3456,
  OAUTH_CALLBACK_SERVER_TIMEOUT: 5 * 60 * 100,
  OAUTH_CALLBACK_URL: 'http://localhost:3456',
  OAUTH_CLIENT_SECRET: 'pkujkL2hWIiCI2Ekt3GBshSbSUYaUQQZOY5lY3vy',
  OAUTH_AUTH_CODE_URL: 'http://seller-area.dotshop.com/admin/oauth/authorize?response_type=code&client_id=2&redirect_url=http://localhost:3456/&state=',
  OAUTH_ACCESS_TOKEN_URL: 'http://seller-area.dotshop.com/admin/oauth/token',

  SELLER_AREA_API_BASE_URI: 'http://api.dotshop.com',
  SELLER_AREA_WEB_BASE_URI: 'http://seller-area.dotshop.com',

  STARTER_THEME_GIT_REPOSITORY: 'git@github.com:NextmediaMa/funri.git',

  CLI_GLOBAL_CONFIG_DIR: path.resolve(homedir(), '.youcan'),
  CLI_GLOBAL_CONFIG_PATH: path.resolve(homedir(), '.youcan', 'config.json'),

  THEME_FILE_TYPES: ['layouts', 'templates', 'sections', 'locales', 'assets', 'snippets'],
};
