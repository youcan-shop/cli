import type { SimpleGit, TaskOptions } from 'simple-git';
import git from 'simple-git';
import * as System from './system';

export async function binaryExists(): Promise<boolean> {
  try {
    await System.exec('git', ['--version']);

    return true;
  }
  catch {
    return false;
  }
}

export interface CloneOptions {
  url: string;
  destination: string;
  progressUpdater?: (statusString: string) => void;
  shallow?: boolean;
  latestTag?: boolean;
}

export async function assertGitExists(): Promise<void> {
  if (!(await binaryExists())) {
    throw new Error('Git is required for the setup to continue.');
  }
}

export async function clone(cloneOptions: CloneOptions): Promise<void> {
  await assertGitExists();

  const { url, destination, shallow, latestTag } = cloneOptions;

  const [repository, branch] = url.split('#');
  const options: TaskOptions = { '--recurse-submodules': null };

  // ignore latest tag if branch is provided
  if (branch) {
    options['--branch'] = branch;
  }

  if (shallow && latestTag) {
    throw new Error('Cannot get a shallow clone of the latest branch.');
  }

  if (shallow) {
    options['--depth'] = 1;
  }

  const simpleGitOptions = {
    config: ['core.askpass=true'],
  };

  await git(simpleGitOptions)
    .clone(repository!, destination, options);

  if (latestTag) {
    const localRepo = git(destination);
    const latestTag = await getLocalLatestTag(localRepo, url);

    await localRepo.checkout(latestTag);
  }
}

async function getLocalLatestTag(repository: SimpleGit, url: string): Promise<string> {
  const latest = (await repository.tags()).latest;

  if (!latest) {
    throw new Error(`Couldn't infer the latest tag from ${url}`);
  }

  return latest;
}
