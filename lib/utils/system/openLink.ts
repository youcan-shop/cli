import { execSync } from 'child_process';
const { platform } = process;

/**
 * Get the command to open a link based on the platform
 * https://dwheeler.com/essays/open-files-urls.htm
 */
function openCommand(): string {
  switch (platform) {
    case 'linux':
      return 'xdg-open';
    case 'darwin':
      return 'open';
    case 'win32':
      return 'cmd /c start';
    default:
      throw new Error('Platform not supported.');
  }
}

/**
 * Open a link in the default browser
 * @param url - URL to open
 */
export default function openLink(url: string) {
  return new Promise<void>((resolve, reject) => {
    try {
      const command = openCommand();
      execSync(`${command} '${url}'`);
      return resolve();
    }
    catch (error) {
      return reject(error);
    }
  });
}
