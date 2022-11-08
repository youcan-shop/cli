import cac from 'cac';
import loginCommand from '../commands/login';

const cli = cac('youcan');

export default function main() {
  cli.command('auth', 'Login to YouCan').option('-s, --store', 'A store to log into.').action(loginCommand);
  cli.help();
  cli.parse();
}

export const stdout = console;
