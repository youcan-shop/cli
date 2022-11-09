import cac from 'cac';
import commands from '../commands';
import stdout from '../utils/system/stdout';

const cli = cac('youcan');

/**
 * Starting point of the cli,
 * here we initialize the CLI and setup necessary commands
 */
export default function main() {
  try {
    Object.values(commands).forEach(command => command.setup(cli));

    cli.on('command:*', () => {
      throw new Error(`Invalid command: ${cli.args.join(' ')}`);
    });
    cli.help();
    cli.parse();
  }
  catch (err: unknown) {
    if (err instanceof Error)
      stdout.error(err.message);
    process.exit(1);
  }
}

