import fs from 'fs';
import { execa } from 'execa';
import { expect, it } from 'vitest';

export default () => {
  it('Should pull the starter theme in the current working directory', async () => {
    await execa('node', ['./dist/index.js', 'init', '--default']);

    expect(fs.existsSync('Starter')).toBe(true);
  });

  it('Starter theme should have .youcan file', async () => {
    expect(fs.existsSync('./Starter/.youcan')).toBe(true);
  },
  );
};
