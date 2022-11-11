import { existsSync, promises as fspromise } from 'fs';
import { cac } from 'cac';
import * as commands from './commands';
import type { CommandDefinition } from './commands/types';
import Client from '@/core/client';
import config from '@/config';

const cli = {
  client: new Client(),
  handler: cac('youcan'),

  registerCommand(command: CommandDefinition) {
    const instance = this.handler
      .command(command.name, command.description)
      .action(command.action);

    command.aliases?.forEach(a => instance.alias(a));
    command.options?.forEach(o => instance.option(o.name, o.description, o.config));
  },

  async init() {
    Object.values(commands).forEach((command: CommandDefinition) => this.registerCommand(command));

    this.handler.on('command:*', () => {
      this.handler.outputHelp();
    });

    this.handler.help();
    this.handler.parse();

    await this.prepareClient();
  },

  async prepareClient() {
    if (!existsSync(config.CLI_GLOBAL_CONFIG_PATH)) {
      await fspromise.mkdir(config.CLI_GLOBAL_CONFIG_DIR);
      await fspromise.writeFile(config.CLI_GLOBAL_CONFIG_PATH, '', { flag: 'wx', encoding: 'utf-8' });

      return;
    }

    const data = await fspromise
      .readFile(config.CLI_GLOBAL_CONFIG_PATH, 'utf-8')
      .then(b => JSON.parse(b));

    if ('access_token' in data)
      this.client.setAccessToken(data.token);
  },
};

export default cli;
