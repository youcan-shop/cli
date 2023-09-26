import { Filesystem, Github, Path, String } from '@youcan/cli-kit';

interface InitServiceOptions {
  name: string
  directory: string
  template: string
}

async function initService(options: InitServiceOptions) {
  const slug = String.hyphenate(options.name);
  const outdir = Path.join(options.directory, slug);

  await assertDirectoryAvailability(outdir, slug);

  const repo = Github.parseRepositoryReference(options.template);
  await Filesystem.tapIntoTmp(async (tmp) => {
    const templateDownloadDirectory = Path.join(tmp, 'download');

    const templatePathDirectory = repo.path
      ? Path.join(templateDownloadDirectory, repo.path)
      : templateDownloadDirectory;

    const scaffoldDirectory = Path.join(tmp, 'app');

    const url = repo.branch ? `${repo.baseUrl}#${repo.branch}` : repo.baseUrl;

    await Filesystem.mkdir(templateDownloadDirectory);
  });
}

async function assertDirectoryAvailability(directory: string, name: string): Promise<void> {
  const exists = await Filesystem.exists(directory);

  if (exists) {
    throw new Error(`\nThe directory \`${name}\` already exists, please choose a new name for your app`);
  }
}

export default initService;
