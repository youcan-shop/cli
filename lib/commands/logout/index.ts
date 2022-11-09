import { stdout } from '../../cli/main';
import { homeDir } from '../../utils/common';
import deleteFile from '../../utils/system/deleteFile';

async function logoutAction() {
  const filePath = `${homeDir}/.youcan`;
  await deleteFile(filePath);
  stdout.log('Logged out successfully.');
}

export default {
  setup(cli: any) {
    cli.command('logout', 'Logout from YouCan')
      .action(logoutAction);
  },
};
