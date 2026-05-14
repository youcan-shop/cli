import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'glob';
import { defineConfig } from 'rolldown';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  input: glob.sync('lib/**/*.ts'),
  external: id => !id.startsWith('.') && !id.startsWith('@/'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'lib'),
    },
  },
  output: {
    dir: 'dist',
    exports: 'named',
    format: 'esm',
    preserveModules: true,
  },
});
