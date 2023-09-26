import { fileURLToPath } from 'node:url';
import typescript from 'rollup-plugin-typescript2';
import { nodeExternals } from 'rollup-plugin-node-externals';
import { glob } from 'glob';

export default {
  input: glob.sync('lib/**/*.ts').map(f => fileURLToPath(new URL(f, import.meta.url))),
  plugins: [
    nodeExternals(),
    typescript({ tsconfig: 'tsconfig.json' }),
  ],
  output: {
    dir: 'dist',
    exports: 'named',
    format: 'es',
    preserveModules: true,
  },
};
