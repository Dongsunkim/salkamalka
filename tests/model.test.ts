import { describe, expect, it } from 'vitest';
import {
  createWish,
  decideWish,
  HOUR,
  monthKey,
  monthlySummary,
  parseSaved,
  postponeWish,
  remaining,
  type WishInput,
} from '../src/model';

const input: WishInput = {
  name: '  여행용 가방  ',
  price: 89000,
  category: '패션',
  reason: '여행 갈 때',
  similar: 'yes',
  usePlan: '다음 달',
  hours: 24,
};
const now = Date.parse('2026-10-31T14:00:00Z');

describe('purchase reflection rules', () => {
  it('requires real names and integer prices, trims names, and schedules a full day', () => {
    expect(() => createWish({ ...input, name: '  ' }, now)).toThrow();
    for (const price of [0, -1, 0.5, Infinity, 1_000_000_001])
      expect(() => createWish({ ...input, price }, now)).toThrow();
    const item = createWish(input, now);
    expect(item.name).toBe('여행용 가방');
    expect(item.reviewAt).toBe(now + 24 * HOUR);
    expect(item.status).toBe('waiting');
  });
  it('blocks decisions before the deadline and allows them exactly at the deadline', () => {
    const item = createWish(input, now);
    expect(() => decideWish(item, 'skipped', item.reviewAt - 1)).toThrow();
    const decided = decideWish(item, 'skipped', item.reviewAt);
    expect(decided.decidedAt).toBe(item.reviewAt);
    expect(decided.status).toBe('skipped');
  });
  it('counts the decision month in Korea time rather than creation time or UTC month', () => {
    const item = createWish(input, now - 25 * HOUR);
    const decidedAt = Date.parse('2026-10-31T15:05:00Z');
    expect(monthKey(decidedAt)).toBe('2026-11');
    const decided = decideWish(item, 'skipped', decidedAt);
    expect(monthlySummary([decided], '2026-10').saved).toBe(0);
    expect(monthlySummary([decided], '2026-11').saved).toBe(89000);
  });
  it('undoing a decision removes its amount from the old month and resets the rating', () => {
    const item = createWish(input, now - 25 * HOUR);
    const skipped = decideWish(item, 'skipped', now);
    const restored = postponeWish({ ...skipped, satisfaction: null }, now + HOUR);
    expect(monthlySummary([restored], monthKey(now)).saved).toBe(0);
    expect(restored.decidedAt).toBeNull();
    expect(restored.reviewAt).toBe(now + 25 * HOUR);
    expect(restored.satisfaction).toBeNull();
  });
  it('does not combine pending prices and bought prices with the skipped amount', () => {
    const waiting = createWish(input, now - 25 * HOUR);
    const skipped = decideWish({ ...waiting, id: 'skip' }, 'skipped', now);
    const bought = decideWish({ ...waiting, id: 'buy', price: 50000 }, 'bought', now);
    expect(monthlySummary([waiting, skipped, bought], monthKey(now))).toEqual({
      saved: 89000,
      spent: 50000,
      skippedCount: 1,
      boughtCount: 1,
      total: 2,
    });
  });
  it('rounds remaining minutes up and handles the exact deadline', () => {
    expect(remaining(now + 1, now)).toBe('1분 뒤에 다시 보기');
    expect(remaining(now + HOUR, now)).toBe('1시간 뒤에 다시 보기');
    expect(remaining(now, now)).toBe('이제 결정할 수 있어요');
  });
});

describe('stored record validation', () => {
  it('round-trips valid records and rejects corrupted data without replacing it', () => {
    const item = createWish(input, now);
    expect(parseSaved(null)).toEqual([]);
    expect(parseSaved(JSON.stringify({ version: 1, items: [item] }))).toEqual([item]);
    for (const payload of [
      'invalid json',
      { version: 2, items: [] },
      { version: 1, items: [{ ...item, price: -1 }] },
      { version: 1, items: [{ ...item, createdAt: 1e30 }] },
      { version: 1, items: [item, item] },
      { version: 1, items: [{ ...item, status: 'skipped', decidedAt: null }] },
    ]) {
      expect(() =>
        parseSaved(typeof payload === 'string' ? payload : JSON.stringify(payload)),
      ).toThrow();
    }
  });
});
