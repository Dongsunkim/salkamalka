import {
  ArrowUpRight,
  Clock3,
  Check,
  ShoppingBag,
  Shirt,
  Headphones,
  Sparkles,
  House,
  Package,
  Heart,
} from 'lucide-react';
import { remaining, shortDate, won, type Category, type Wish } from '../model';

export const CATEGORY_ICONS = {
  패션: Shirt,
  디지털: Headphones,
  취미: Heart,
  생활: House,
  뷰티: Sparkles,
  기타: Package,
};
export function CategoryIcon({ category }: { category: Category }) {
  const Icon = CATEGORY_ICONS[category];
  return (
    <span className={`category-icon category-${category}`}>
      <Icon size={23} strokeWidth={1.7} />
    </span>
  );
}
export function WishCard({ item, now, onOpen }: { item: Wish; now: number; onOpen: () => void }) {
  const ready = item.status === 'waiting' && item.reviewAt <= now;
  return (
    <button
      className={`wish-card ${ready ? 'ready-card' : ''}`}
      onClick={onOpen}
      aria-label={`${item.name} 상세 보기`}
    >
      <div className="card-heading">
        <CategoryIcon category={item.category} />
        <span className={`status-badge ${ready ? 'ready' : item.status}`}>
          {item.status === 'waiting' ? (
            <Clock3 size={12} />
          ) : item.status === 'bought' ? (
            <ShoppingBag size={12} />
          ) : (
            <Check size={12} />
          )}
          {item.status === 'waiting'
            ? ready
              ? '결정할 시간'
              : '천천히 생각 중'
            : item.status === 'bought'
              ? '구매했어요'
              : '안 사기로 했어요'}
        </span>
      </div>
      <p className="card-category">{item.category}</p>
      <h3>{item.name}</h3>
      <p className="card-price">{won(item.price)}</p>
      <p className="card-reason">{item.reason || '조금 기다려 보고 결정하기로 했어요.'}</p>
      <div className="card-footer">
        <span>
          {item.status === 'waiting'
            ? remaining(item.reviewAt, now)
            : `${shortDate(item.decidedAt!)}에 기록했어요`}
        </span>
        <ArrowUpRight size={18} />
      </div>
    </button>
  );
}
