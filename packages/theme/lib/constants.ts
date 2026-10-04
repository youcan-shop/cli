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

export const THEME_FOLDER_ALIASES: Record<string, typeof THEME_FILE_TYPES[number]> = {
  layout: 'layouts',
};
