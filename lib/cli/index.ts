import { existsSync, promises as fspromise } from 'fs';
import { cac } from 'cac';
import * as commands from './commands';
import type { CommandDefinition } from './commands/types';
import Client from '@/core/client';
import config from '@/config';

const cli = {
  client: new Client(),
  handler: cac('youcan'),

  registerCommand(command: (cli: typeof this) => CommandDefinition) {
    const definition = command(this);

    const instance = this.handler
      .command(definition.name, definition.description)
      .action(definition.action);

    definition.aliases?.forEach(a => instance.alias(a));
    definition.options?.forEach(o => instance.option(o.name, o.description, o.config));
  },

  async init() {
    await this.prepareClient();

    Object.values(commands).forEach(command => this.registerCommand(command));

    this.handler.on('command:*', () => {
      this.handler.outputHelp();
    });

    this.handler.help();
    this.handler.parse();
  },

  async prepareClient() {
    if (!existsSync(config.CLI_GLOBAL_CONFIG_DIR))
      await fspromise.mkdir(config.CLI_GLOBAL_CONFIG_DIR);

    if (!existsSync(config.CLI_GLOBAL_CONFIG_PATH))
      return await fspromise.writeFile(config.CLI_GLOBAL_CONFIG_PATH, '', { flag: 'wx', encoding: 'utf-8' });

    const data = await fspromise
      .readFile(config.CLI_GLOBAL_CONFIG_PATH, 'utf-8')
      .then((b) => {
        try { return JSON.parse(b); }
        catch { return {}; }
      });

    if ('access_token' in data)
      this.client.setAccessToken(data.access_token);
  },
};

export default cli;
