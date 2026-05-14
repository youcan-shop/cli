import { fileURLToPath } from 'node:url';
import { glob } from 'glob';

/** @type {import('rolldown').RolldownOptions} */
export default {
  input: glob.sync('lib/**/*.ts').map(f => fileURLToPath(new URL(f, import.meta.url))),
  external(id) {
    return !id.startsWith('.') && !id.startsWith('/') && !/^[A-Z]:/i.test(id);
  },
  output: {
    dir: 'dist',
    exports: 'named',
    format: 'esm',
    preserveModules: true,
  },
};
