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

export async function run<T = unknown>(tasks: Task[]) {
  const context: T = {} as T;

  for (const task of tasks) {
    Loader.exec(task.title, async (loader) => {
      try {
        const subtasks = await runTask(task, context);

        if (Array.isArray(subtasks) && subtasks.length > 0 && subtasks.every(t => 'task' in t)) {
          for (const subtask of subtasks) {
            await runTask(subtask, context);
          }
        }
      }
      catch (err) {
        loader.error(String(err));
        throw err;
      }
    });
  }
}
