import type { Metadata } from './types';

export const THEME_CONFIG_FILENAME = 'youcan.theme.json';

export const THEME_FILE_TYPES: Array<keyof Metadata> = [
  'layouts',
  'sections',
  'locales',
  'assets',
  'snippets',
  'config',
  'templates',
];
