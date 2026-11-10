import { useCallback, useEffect, useRef, useState } from 'react';
import type { Wish } from './model';
import { createRepository, type Repository } from './storage';

export function useWishes(factory = createRepository) {
  const [items, setItems] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const repository = useRef<Repository>();
  const current = useRef<Wish[]>([]);
  const busy = useRef(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    repository.current = undefined;
    factory()
      .then(async (repo) => {
        const loaded = await repo.read();
        if (active) {
          repository.current = repo;
          current.current = loaded;
          setItems(loaded);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : '기록을 불러오지 못했어요.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [factory, attempt]);

  const update = useCallback(async (transform: (previous: Wish[]) => Wish[]) => {
    if (busy.current || !repository.current) return false;
    busy.current = true;
    setSaving(true);
    try {
      const next = transform(current.current);
      await repository.current.write(next);
      current.current = next;
      setItems(next);
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장하지 못했어요. 다시 시도해 주세요.');
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }, []);
  return {
    items,
    loading,
    saving,
    error,
    update,
    ready: !!repository.current,
    retry: () => setAttempt((previous) => previous + 1),
  };
}
