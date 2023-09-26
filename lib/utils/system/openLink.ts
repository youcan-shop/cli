import { execSync } from 'child_process';
const { platform } = process;

const PLATFORM_OPEN_CMD_MAP = {
  win32: 'cmd /c start',
  linux: 'xdg-open',
  darwin: 'open',
};

export default function openLink(url: string) {
  if (!(platform in PLATFORM_OPEN_CMD_MAP)) {
    throw new Error('Platform not supported');
  }

  execSync(`${PLATFORM_OPEN_CMD_MAP[platform as keyof typeof PLATFORM_OPEN_CMD_MAP]} '${url}'`);
}
