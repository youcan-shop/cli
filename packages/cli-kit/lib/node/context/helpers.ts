export function truthy(val: string | undefined): boolean {
  if (!val) {
    return false;
  }

  return ['1', 'true', 'TRUE', 'yes', 'YES', 'y', 'Y'].includes(val);
}
