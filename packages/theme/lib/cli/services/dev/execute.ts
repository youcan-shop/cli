import type { Worker } from '@youcan/cli-kit';
import { Env, Form, Http, Path } from '@youcan/cli-kit';
import type { FormDataResolvable } from '@youcan/cli-kit/dist/node/form';
import type { Theme } from '@/types';
import type { THEME_FILE_TYPES } from '@/constants';

export async function execute(
  theme: Theme,
  op: 'save' | 'delete',
  type: typeof THEME_FILE_TYPES[number],
  name: string,
  logger: Worker.Logger | null = null,
): Promise<void> {
  try {
    const path = Path.join(theme.root, type, name);

    const payload: Record<string, FormDataResolvable> = {
      file_name: name,
      file_type: type,
      file_operation: op,
    };

    if (op === 'save') {
      payload.file_content = await Form.file(path);
    }

    await Http.post(
      `${Env.apiHostname()}/themes/${theme.theme_id}/update`,
      {
        body: Form.convert(payload),
      },
    );

    logger && logger.write(`[${op === 'save' ? 'updated' : 'deleted'}] - ${Path.join(type, name)}`);
  }
  catch (err) {
    if (err instanceof Error && logger) {
      logger.write(`[error] - ${Path.join(type, name)}\n${err.message}`);

      return;
    }

    throw err;
  }
}
