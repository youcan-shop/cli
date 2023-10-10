import { Cli } from '@youcan/cli-kit';
import loginService from '@/cli/services/auth/login';

export default class Login extends Cli.Command {
  public async run(): Promise<void> {
    await loginService(this);
  }
}
