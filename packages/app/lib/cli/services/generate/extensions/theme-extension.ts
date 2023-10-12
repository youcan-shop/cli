import type { ExtensionTemplate } from '@/types';

export default {
  name: 'Theme extension',
  identifier: 'theme-extension',
  description: 'Liquid snippets to extend store themes',
  types: [
    {
      url: 'https://github.com/youcan-shop/app-extension-templates',
      type: 'theme',
      flavors: [
        {
          name: 'Liquid',
          value: 'liquid',
          path: 'theme-extension/liquid',
        },
      ],
    },
  ],
} as ExtensionTemplate;
