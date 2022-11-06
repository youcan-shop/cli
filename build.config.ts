import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: [
    'lib/index',
    {
      builder: 'mkdist',
      input: 'lib/cli',
      outDir: 'dist/cli',
    },
  ],
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: true,
  },
});
