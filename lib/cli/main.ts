import cac from 'cac';
import commands from '../commands';

const cli = cac('youcan');

export default function main() {
  try {
    Object.values(commands).forEach(command => command.setup(cli));
    cli.help();
    cli.parse();
  }
  catch (err: unknown) {
    console.error(err);
    process.exit(1);
  }
}

export const stdout = console;
