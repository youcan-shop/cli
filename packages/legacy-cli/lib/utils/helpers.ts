export function stripln(buffer: string, ln: number): string {
  let index = 0;

  while (ln-- > 0) {
    const lfIndex = buffer.indexOf('\n', index);

    if (lfIndex >= 0) {
      index = lfIndex + 1;
    }
  }

  return index > 0 ? buffer.substring(index) : buffer;
}

export function splitln(buffer: string, limit: number): string[] {
  const cols = buffer.trim().split(/\s+/);

  if (cols.length > limit) {
    cols[limit - 1] = cols.slice(limit - 1).join(' ');
  }

  return cols;
}

export function getcols(buffer: string, indices: number[], limit: number | null = null) {
  const lines = buffer.split(/(\r\n|\n|\r)/);
  const cols: string[][] = [];

  if (!limit) {
    limit = Math.max.apply(null, indices) + 1;
  }

  lines.forEach((ln) => {
    const lncols = splitln(ln, limit!);
    const lncol: string[] = [];

    indices.forEach((index) => {
      lncol.push(lncols[index] || '');
    });

    cols.push(lncol);
  });

  return cols;
}
