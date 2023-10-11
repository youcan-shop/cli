import typescript from 'rollup-plugin-typescript2';
import { nodeExternals } from 'rollup-plugin-node-externals';

export default {
  input: 'lib/index.ts',
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
