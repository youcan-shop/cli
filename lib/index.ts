import { stdout } from './cli/main';
import loginCommand from './commands/login';

stdout.log('index');
loginCommand();
