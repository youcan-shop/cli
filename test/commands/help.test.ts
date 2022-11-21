import { describe, expect, it } from 'vitest';
import { execa } from 'execa';
import cli from '@/cli';

const _availableCommands = cli.getAvailableCommands();

describe('--help command', () => {
  it('It should output a list of available commands', async () => {
    const { stdout } = await execa('node', ['./dist/index.js', '--help']);

    _availableCommands.forEach((command) => {
      expect(stdout).toContain(command.name);
    });
  });
});
