import fs from 'fs';
import { execa } from 'execa';
import { expect, it } from 'vitest';

export default () => {
  it('Should delete the Starter theme', async () => {
    await execa('node', ['./dist/index.js', 'delete', '--default']);

    expect(fs.existsSync('Starter')).toBe(false);
  });
};
