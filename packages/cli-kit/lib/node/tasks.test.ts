import { run } from '@/node/tasks';
import { describe, expect, it } from 'vitest';

describe('run', () => {
  it('runs tasks that follow a non-loadable task', async () => {
    const order: string[] = [];
    const record = (name: string) => async () => {
      order.push(name);
    };

    await run({}, [
      { title: 'first', loadable: false, task: record('first') },
      { title: 'second', loadable: false, task: record('second') },
    ]);

    expect(order).toEqual(['first', 'second']);
  });
});
