import fs from 'fs';
import { execa } from 'execa';
import { expect, it } from 'vitest';
import config from '@/config';

export default () => {
  it('It should delete .youcan.json file inside ~/.youcan folder', async () => {
    await execa('node', ['./dist/index.js', 'logout']);
    expect(fs.existsSync(config.CLI_GLOBAL_CONFIG_PATH)).toBe(false);
  });
};
