import { Git, Tasks } from '@youcan/cli-kit';

export async function clone(url: string, destination: string) {
  await Tasks.run([
    {
      title: `Cloning ${url} into ${destination}`,
      task: async () => {
        await Git.clone({ url, destination });
      },
    },
  ]);
}
