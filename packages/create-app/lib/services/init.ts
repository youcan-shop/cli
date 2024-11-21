import path from 'path';
import type { Cli } from '@youcan/cli-kit';
import { Filesystem, Git, Github, Path, String, System, Tasks } from '@youcan/cli-kit';
import type { inferUserPackageManager } from '@youcan/cli-kit/dist/node/system';

interface InitServiceOptions {
  name: string
  directory: string
  template?: string
  packageManager: ReturnType<typeof inferUserPackageManager>
}

async function initService(command: Cli.Command, options: InitServiceOptions) {
  const slug = String.hyphenate(options.name);
  const outdir = Path.join(options.directory, slug);
  const relativeOutdir = path.relative(process.cwd(), outdir);

  await assertDirectoryAvailability(outdir, slug);

  const repo = options.template
    ? Github.parseRepositoryReference(options.template)
    : null;

  await Filesystem.tapIntoTmp(async (tmp) => {
    const templateDownloadDirectory = Path.join(tmp, 'download');

    await Filesystem.mkdir(templateDownloadDirectory);

    await Tasks.run({}, [
      {
        title: 'Closing app template...',
        skip: () => repo == null,
        task: async () => {
          const url = repo!.branch
            ? `${repo!.baseUrl}#${repo!.branch}`
            : repo!.baseUrl;

          await Git.clone({
            url,
            shallow: true,
            destination: templateDownloadDirectory,
          });
        },
      },
      {
        title: 'Configuring app...',
        task: async () => {
          await Filesystem.writeJsonFile(
            Path.join(templateDownloadDirectory, 'youcan.app.json'),
            { name: slug },
          );
        },
      },
      {
        title: `Copying files to ${relativeOutdir}...`,
        task: async () => {
          await Filesystem.move(templateDownloadDirectory, outdir);
        },
      },
      {
        title: 'Installing dependencies...',
        loadable: false,
        task: async () => {
          await System.exec(options.packageManager, ['install'], {
            stdout: 'inherit',
            stderr: 'inherit',
            cwd: outdir,
          });
        },
      },
    ]);
  });

  command.output.info(`${slug} is ready for your to develop! Head to the docs for more information`);
  command.output.info('   Developer Docs: https://developer.youcan.shop\n\n');

  command.output.info('   To preview your app, run');
  command.output.info(`      cd ${relativeOutdir}`);
  command.output.info(`      ${options.packageManager} dev`);
  command.output.info('   For an overview of all the command, run `pnpm youcan app help`');
}

async function assertDirectoryAvailability(directory: string, name: string): Promise<void> {
  const exists = await Filesystem.exists(directory);

  if (exists) {
    throw new Error(`\nThe directory \`${name}\` already exists, please choose a new name for your app`);
  }
}

export default initService;
