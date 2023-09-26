import { execSync } from 'child_process';

/**
 * Clone a git repository
 * @param url - URL to open
 * @param folder
 */
export default function cloneRepository(url: string, folder: string) {
  try {
    execSync(`git clone '${url}' '${folder}'`);

    return true;
  }
  catch (error) {
    return false;
  }
}
