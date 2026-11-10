import { parseSaved, type Wish } from './model';

export const STORAGE_KEY = 'salka-malka:v1';
export interface Repository {
  read(): Promise<Wish[]>;
  write(items: Wish[]): Promise<void>;
}

export function isTossWebView() {
  return 'ReactNativeWebView' in window || '__appsInTossConstants' in window;
}

// Browser storage is intentionally isolated from the Toss account-scoped storage.
// A failure in the native bridge must never fall back to another user's data.
export async function createRepository(): Promise<Repository> {
  if (isTossWebView()) {
    const { User, Storage } = await import('@apps-in-toss/web-framework');
    const user = await User.getAnonymousKey();
    if (!user?.hash) throw new Error('사용자 정보를 확인하지 못했어요. 앱을 다시 열어 주세요.');
    const key = `${STORAGE_KEY}:${user.hash}`;
    return {
      read: async () => parseSaved(await Storage.getItem(key)),
      write: async (items) => {
        await Storage.setItem(key, JSON.stringify({ version: 1, items }));
      },
    };
  }
  return {
    read: async () => parseSaved(localStorage.getItem(STORAGE_KEY)),
    write: async (items) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, items }));
    },
  };
}
