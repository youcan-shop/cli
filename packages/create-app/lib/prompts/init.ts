import type { Cli } from '@youcan/cli-kit';

interface InitOutput {
  name?: string;
  template?: string;
}

export const TEMPLATES: Record<string, { label: string; url?: string }> = {
  'nuxt': {
    label: 'Start with Nuxt (recommended)',
    url: 'https://github.com/youcan-shop/shop-app-template-nuxt',
  },
  'extension-only': {
    label: 'Start with an extension only',
    url: 'https://github.com/youcan-shop/shop-app-template-none',
  },
  'none': {
    label: 'A blank canvas',
  },
};

const ADJECTIVES = ['Amber', 'Bold', 'Coral', 'Crimson', 'Golden', 'Indigo', 'Jade', 'Lively', 'Lunar', 'Mellow', 'Nimble', 'Polar', 'Rapid', 'Scarlet', 'Silent', 'Solar', 'Swift', 'Velvet', 'Vivid', 'Zesty'];
const NOUNS = ['Anchor', 'Beacon', 'Canyon', 'Comet', 'Falcon', 'Harbor', 'Heron', 'Lantern', 'Meadow', 'Nectar', 'Orchid', 'Otter', 'Pebble', 'Quill', 'Reef', 'Sparrow', 'Summit', 'Thicket', 'Tide', 'Willow'];

function suggestName(): string {
  const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];

  return `${pick(ADJECTIVES)} ${pick(NOUNS)}`;
}

async function initPrompt(command: Cli.Command): Promise<InitOutput> {
  const defaults = {
    name: suggestName(),
    template: TEMPLATES.nuxt.url,
  } as const;

  command.log('\nHello! Start by picking a name for your app.');

  const response = await command.prompt([
    {
      name: 'name',
      type: 'text',
      initial: defaults.name,
      message: 'Your app\'s name',
      validate: (v: string) => {
        if (!v.length) {
          return 'App name cannot be empty';
        }

        if (v.length > 32) {
          return 'App name cannot exceed 32 characters';
        }

        return true;
      },
    },
    {
      type: 'select',
      name: 'template',
      message: 'Your app\'s starting template',
      format: v => TEMPLATES[v as keyof typeof TEMPLATES]?.url,
      choices: Object
        .entries(TEMPLATES)
        .map(([k, v]) => ({ title: v.label, value: k })),
    },
  ]);

  return response;
}

export default initPrompt;
