import { readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { glob } from 'glob';
import { defineConfig } from 'rolldown';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  input: glob.sync('lib/**/*.ts'),
  external: [
    ...builtinModules,
    /^node:/,
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
  ],
  output: {
    dir: 'dist',
    exports: 'named',
    format: 'esm',
    preserveModules: true,
  },
});
