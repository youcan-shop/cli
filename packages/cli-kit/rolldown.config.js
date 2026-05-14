import { glob } from 'glob';
import { defineConfig } from 'rolldown';

export default defineConfig({
  input: glob.sync('lib/**/*.{ts,tsx}'),
  external: id => !id.startsWith('.'),
  output: {
    dir: 'dist',
    exports: 'named',
    format: 'esm',
    preserveModules: true,
  },
});
