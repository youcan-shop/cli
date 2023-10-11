import { Flags } from '@oclif/core';
import { Path } from '@youcan/cli-kit';

export const THEME_FLAGS = {
  path: Flags.string({
    env: 'YC_FLAG_PATH',
    default: async () => Path.cwd(),
    parse: async input => Path.resolve(input),
    description: 'The path to your theme directory.',
  }),
};
