import type { CommandDefinition } from '@/cli/commands/types';

const loginCommand: CommandDefinition = {
  name: 'login',
  group: 'auth',
  description: 'Log into a YouCan store',

  action: async () => {
    console.log('hi');
  },
};

export default loginCommand;
