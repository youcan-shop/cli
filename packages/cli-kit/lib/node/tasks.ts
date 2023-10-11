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

export async function run<T = unknown>(tasks: Task<T>[]) {
  const context: T = {} as T;

  for await (const task of tasks) {
    await Loader.exec(task.title, async (loader) => {
      try {
        const subtasks = await runTask<T>(task, context);

        if (Array.isArray(subtasks) && subtasks.length > 0 && subtasks.every(t => 'task' in t)) {
          for await (const subtask of subtasks) {
            await runTask(subtask, context);
          }
        }

        loader.stop();
      }
      catch (err) {
        loader.error(String(err));

        throw err;
      }
    });
  }
}
