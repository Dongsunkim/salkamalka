import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWish } from '../src/model';
import { createRepository, STORAGE_KEY } from '../src/storage';

const sdk = vi.hoisted(() => ({
  User: { getAnonymousKey: vi.fn() },
  Storage: { getItem: vi.fn(), setItem: vi.fn() },
}));
vi.mock('@apps-in-toss/web-framework', () => sdk);
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

describe('native storage isolation', () => {
  it('uses a separate storage key for every Toss user', async () => {
    vi.stubGlobal('ReactNativeWebView', { postMessage: vi.fn() });
    const records = new Map<string, string>();
    sdk.Storage.getItem.mockImplementation(async (key) => records.get(key) ?? null);
    sdk.Storage.setItem.mockImplementation(async (key, value) => {
      records.set(key, value);
    });
    const item = createWish({
      name: '가방',
      price: 30000,
      category: '패션',
      reason: '',
      similar: 'no',
      usePlan: '',
      hours: 24,
    });
    sdk.User.getAnonymousKey.mockResolvedValue({ type: 'HASH', hash: 'user-a' });
    await (await createRepository()).write([item]);
    expect(sdk.Storage.setItem).toHaveBeenCalledWith(`${STORAGE_KEY}:user-a`, expect.any(String));
    sdk.User.getAnonymousKey.mockResolvedValue({ type: 'HASH', hash: 'user-b' });
    expect(await (await createRepository()).read()).toEqual([]);
    sdk.User.getAnonymousKey.mockResolvedValue({ type: 'HASH', hash: 'user-a' });
    expect(await (await createRepository()).read()).toEqual([item]);
  });
  it('does not fall back to shared browser data when native identification fails', async () => {
    vi.stubGlobal('ReactNativeWebView', { postMessage: vi.fn() });
    localStorage.setItem(STORAGE_KEY, 'do not use another storage backend');
    sdk.User.getAnonymousKey.mockRejectedValue(new Error('사용자를 확인하지 못했어요.'));
    await expect(createRepository()).rejects.toThrow('사용자를 확인하지 못했어요.');
    expect(sdk.Storage.getItem).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('do not use another storage backend');
  });
});
