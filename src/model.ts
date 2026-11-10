export const CATEGORIES = ['패션', '디지털', '취미', '생활', '뷰티', '기타'] as const;
export type Category = (typeof CATEGORIES)[number];
export type Status = 'waiting' | 'bought' | 'skipped';
export type Similar = 'yes' | 'no' | 'unsure';
export interface Wish {
  id: string;
  name: string;
  price: number;
  category: Category;
  reason: string;
  similar: Similar;
  usePlan: string;
  createdAt: number;
  reviewAt: number;
  status: Status;
  decidedAt: number | null;
  satisfaction: number | null;
}
export type WishInput = Pick<
  Wish,
  'name' | 'price' | 'category' | 'reason' | 'similar' | 'usePlan'
> & { hours: number };
export const HOUR = 3_600_000;
export const won = (value: number) => `${value.toLocaleString('ko-KR')}원`;
export const monthKey = (time: number) =>
  new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    timeZone: 'Asia/Seoul',
  }).format(time);
export const shortDate = (time: number) =>
  new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(time);

export function createWish(input: WishInput, now = Date.now()): Wish {
  const name = input.name.trim();
  if (!name || name.length > 80) throw new Error('물건 이름을 80자 이내로 적어 주세요.');
  if (!Number.isSafeInteger(input.price) || input.price < 1 || input.price > 1_000_000_000) {
    throw new Error('가격은 1원부터 10억 원까지 입력할 수 있어요.');
  }
  if (!CATEGORIES.includes(input.category) || ![24, 48, 168].includes(input.hours)) {
    throw new Error('카테고리와 기다릴 시간을 다시 선택해 주세요.');
  }
  if (!['yes', 'no', 'unsure'].includes(input.similar))
    throw new Error('질문 답변을 다시 선택해 주세요.');
  if (input.reason.length > 300 || input.usePlan.length > 200)
    throw new Error('메모가 너무 길어요.');
  return {
    id: crypto.randomUUID(),
    name,
    price: input.price,
    category: input.category,
    reason: input.reason.trim(),
    similar: input.similar,
    usePlan: input.usePlan.trim(),
    createdAt: now,
    reviewAt: now + input.hours * HOUR,
    status: 'waiting',
    decidedAt: null,
    satisfaction: null,
  };
}

export function decideWish(item: Wish, status: Exclude<Status, 'waiting'>, now = Date.now()): Wish {
  if (now < item.reviewAt) throw new Error('기다리기로 한 시간이 지나면 결정할 수 있어요.');
  return { ...item, status, decidedAt: now, satisfaction: null };
}

export function postponeWish(item: Wish, now = Date.now()): Wish {
  return {
    ...item,
    status: 'waiting',
    reviewAt: now + 24 * HOUR,
    decidedAt: null,
    satisfaction: null,
  };
}

export function remaining(reviewAt: number, now: number) {
  const minutes = Math.max(0, Math.ceil((reviewAt - now) / 60_000));
  if (minutes === 0) return '이제 결정할 수 있어요';
  if (minutes < 60) return `${minutes}분 뒤에 다시 보기`;
  const hours = Math.floor(minutes / 60);
  return `${hours}시간${minutes % 60 ? ` ${minutes % 60}분` : ''} 뒤에 다시 보기`;
}

export function monthlySummary(items: Wish[], month: string) {
  const decided = items.filter(
    (item) => item.decidedAt !== null && monthKey(item.decidedAt) === month,
  );
  const skipped = decided.filter((item) => item.status === 'skipped');
  const bought = decided.filter((item) => item.status === 'bought');
  return {
    saved: skipped.reduce((sum, item) => sum + item.price, 0),
    spent: bought.reduce((sum, item) => sum + item.price, 0),
    skippedCount: skipped.length,
    boughtCount: bought.length,
    total: decided.length,
  };
}

export function parseSaved(raw: string | null): Wish[] {
  if (raw === null) return [];
  const data: unknown = JSON.parse(raw);
  if (
    !data ||
    typeof data !== 'object' ||
    !('version' in data) ||
    data.version !== 1 ||
    !('items' in data) ||
    !Array.isArray(data.items)
  )
    throw new Error('저장한 기록의 형식이 올바르지 않아요.');
  const items: Wish[] = [];
  const ids = new Set<string>();
  for (const item of data.items as unknown[]) {
    if (!item || typeof item !== 'object') throw new Error('손상된 기록이 있어요.');
    const w = item as Wish;
    if (
      typeof w.id !== 'string' ||
      !w.id ||
      ids.has(w.id) ||
      typeof w.name !== 'string' ||
      !w.name.trim() ||
      w.name.length > 80 ||
      !Number.isSafeInteger(w.price) ||
      w.price < 1 ||
      w.price > 1_000_000_000 ||
      !CATEGORIES.includes(w.category) ||
      typeof w.reason !== 'string' ||
      w.reason.length > 300 ||
      typeof w.usePlan !== 'string' ||
      w.usePlan.length > 200 ||
      !['yes', 'no', 'unsure'].includes(w.similar) ||
      !['waiting', 'bought', 'skipped'].includes(w.status) ||
      !validTime(w.createdAt) ||
      !validTime(w.reviewAt) ||
      w.reviewAt < w.createdAt ||
      (w.status === 'waiting' ? w.decidedAt !== null : !validTime(w.decidedAt)) ||
      (w.satisfaction !== null &&
        (w.status !== 'bought' ||
          !Number.isInteger(w.satisfaction) ||
          w.satisfaction < 1 ||
          w.satisfaction > 5))
    ) {
      throw new Error('손상된 기록이 있어요. 기존 데이터는 덮어쓰지 않았어요.');
    }
    ids.add(w.id);
    items.push({
      id: w.id,
      name: w.name,
      price: w.price,
      category: w.category,
      reason: w.reason,
      similar: w.similar,
      usePlan: w.usePlan,
      createdAt: w.createdAt,
      reviewAt: w.reviewAt,
      status: w.status,
      decidedAt: w.decidedAt,
      satisfaction: w.satisfaction,
    });
  }
  return items;
}

function validTime(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 8_640_000_000_000_000
  );
}
