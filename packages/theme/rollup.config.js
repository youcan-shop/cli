import { fileURLToPath } from 'node:url';
import { glob } from 'glob';
import { nodeExternals } from 'rollup-plugin-node-externals';
import typescript from 'rollup-plugin-typescript2';

/** @type {import('rollup').RollupOptions} */
export default {
  input: glob.sync('lib/**/*.ts').map(f => fileURLToPath(new URL(f, import.meta.url))),
  plugins: [
    nodeExternals(),
    typescript({ tsconfig: 'tsconfig.json' }),
  ],
  output: {
    dir: 'dist',
    exports: 'named',
    format: 'esm',
    preserveModules: true,
  },
};
