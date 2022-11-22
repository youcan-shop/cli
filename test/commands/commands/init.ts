import fs from 'fs';
import { execa } from 'execa';
import { expect, it } from 'vitest';

export default () => {
  it('Should pull the starter theme in the current working directory', async () => {
    if (fs.existsSync('./Starter'))
      fs.rmdirSync('./Starter', { recursive: true });

    await execa('node', ['./dist/index.js', 'init', '--default']);

    expect(fs.existsSync('Starter')).toBe(true);
  });
};
