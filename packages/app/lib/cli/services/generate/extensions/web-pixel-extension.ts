import type { ExtensionTemplate } from '@/types';

export default {
  name: 'Web pixel extension',
  identifier: 'web-pixel-extension',
  description: 'A pixel that subscribes to customer events',
  types: [
    {
      url: 'https://github.com/youcan-shop/app-extension-templates',
      type: 'web_pixel',
      flavors: [
        {
          name: 'JavaScript',
          value: 'javascript',
          path: 'web-pixel-extension/javascript',
        },
      ],
    },
  ],
} as ExtensionTemplate;
