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

async function initPrompt(command: Cli.Command): Promise<InitOutput> {
  const defaults = {
    name: 'my-youcan-shop-app',
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
