import { exit } from 'process';
import { Loader } from '@/internal/node/ui';

export interface Task<T = unknown> {
  title: string
  errors?: Error[]
  skip?: (ctx: T) => boolean
  task: (context: T, task: Task<T>) => Promise<void | Task<T>[]>
}

async function runTask<T>(task: Task<T>, ctx: T) {
  if (task.skip?.(ctx)) {
    return;
  }

  return await task.task(ctx, task);
}

export async function run<T = unknown>(ctx: T, tasks: Task<T>[]) {
  for await (const task of tasks) {
    await Loader.exec(task.title, async (loader) => {
      try {
        const subtasks = await runTask<T>(task, ctx);

        if (Array.isArray(subtasks) && subtasks.length > 0 && subtasks.every(t => 'task' in t)) {
          for await (const subtask of subtasks) {
            await runTask(subtask, ctx);
          }
        }

        loader.stop();
      }
      catch (err) {
        loader.error(String(err));
        exit(1);
      }
    });
  }

  return ctx;
}
