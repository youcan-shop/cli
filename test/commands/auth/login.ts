import fs from 'fs';
import { execa } from 'execa';
import { expect, it } from 'vitest';
import config from '@/config';
import messages from '@/config/messages';

export default () => {
  it('It should print OAuth success message ', async () => {
    const { stdout } = await execa('node', ['./dist/index.js', 'login']);
    expect(stdout).toContain(messages.LOGIN_SUCCESS);
  });

  it('should create .youcan.json file inside ~/.youcan folder', () => {
    expect(fs.existsSync(config.CLI_GLOBAL_CONFIG_PATH)).toBe(true);
  });

  it('.youcan file should contain access_token', () => {
    const youcanConfig = fs.readFileSync(config.CLI_GLOBAL_CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(youcanConfig);
    expect(parsed).haveOwnProperty('access_token');
  });
};
