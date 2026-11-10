import { describe, expect, it, vi } from 'vitest';
import { createWish } from '../src/model';
import { createRepository, STORAGE_KEY } from '../src/storage';

describe('browser persistence', () => {
  it('retains records after recreating the repository', async () => {
    const item = createWish({
      name: '키보드',
      price: 50000,
      category: '디지털',
      reason: '',
      similar: 'unsure',
      usePlan: '',
      hours: 24,
    });
    await (await createRepository()).write([item]);
    expect(await (await createRepository()).read()).toEqual([item]);
  });
  it('keeps damaged data untouched instead of silently clearing it', async () => {
    localStorage.setItem(STORAGE_KEY, 'broken');
    await expect((await createRepository()).read()).rejects.toThrow();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('broken');
  });
  it('reports write failure without pretending the record was saved', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    await expect((await createRepository()).write([])).rejects.toThrow('quota');
  });
});
