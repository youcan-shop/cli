import type { Cli } from '@youcan/cli-kit';
import { Filesystem, Git, Github, Path, String, Tasks } from '@youcan/cli-kit';

interface InitServiceOptions {
  name: string
  directory: string
  template: string
}

async function initService(command: Cli.Command, options: InitServiceOptions) {
  const slug = String.hyphenate(options.name);
  const outdir = Path.join(options.directory, slug);

  await assertDirectoryAvailability(outdir, slug);

  const repo = Github.parseRepositoryReference(options.template);

  await Filesystem.tapIntoTmp(async (tmp) => {
    const templateDownloadDirectory = Path.join(tmp, 'download');
    const url = repo.branch ? `${repo.baseUrl}#${repo.branch}` : repo.baseUrl;

    await Filesystem.mkdir(templateDownloadDirectory);

    await Tasks.run({}, [
      {
        title: `Downloading app template from ${url}...`,
        task: async () => {
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
        title: `Copying files to ${outdir}...`,
        task: async () => {
          await Filesystem.move(templateDownloadDirectory, outdir);
        },
      },
    ]);
  });

  command.output.info(`${slug} is ready for your to develop! Head to the docs for more information`);
  command.output.info('   Developer Docs: https://developer.youcan.shop\n\n');

  command.output.info('   To preview your app, run `pnpm dev`');
  command.output.info('   For an overview of all the command, run `pnpm youcan app help`');
}

async function assertDirectoryAvailability(directory: string, name: string): Promise<void> {
  const exists = await Filesystem.exists(directory);

  if (exists) {
    throw new Error(`\nThe directory \`${name}\` already exists, please choose a new name for your app`);
  }
}

export default initService;
