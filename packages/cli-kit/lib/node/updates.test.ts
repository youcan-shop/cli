import { isNewer } from '@/node/updates';
import { describe, expect, it } from 'vitest';

describe('isNewer', () => {
  it('compares semver numerically', () => {
    expect(isNewer('2.9.0', '2.8.3')).toBe(true);
    expect(isNewer('3.0.0', '2.99.99')).toBe(true);
    expect(isNewer('2.8.3', '2.8.3')).toBe(false);
    expect(isNewer('2.8.2', '2.8.3')).toBe(false);
    expect(isNewer('2.10.0', '2.9.0')).toBe(true);
  });

  it('treats missing segments as zero', () => {
    expect(isNewer('2.9', '2.8.3')).toBe(true);
    expect(isNewer('2.8', '2.8.0')).toBe(false);
  });
});
