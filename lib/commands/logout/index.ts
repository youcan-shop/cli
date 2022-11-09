import { homeDir } from '../../utils/common';
import deleteFile from '../../utils/system/deleteFile';
import stdout from '../../utils/system/stdout';

async function logoutAction() {
  const filePath = `${homeDir}/.youcan`;
  await deleteFile(filePath);
  stdout.info('Logged out successfully.');
}

export default {
  setup(cli: any) {
    cli.command('logout', '🚪 Logout from YouCan')
      .action(logoutAction);
  },
};
