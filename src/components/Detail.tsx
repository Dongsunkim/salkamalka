import { useState } from 'react';
import { Button } from '@toss/tds-mobile';
import { Clock3, Star, Trash2 } from 'lucide-react';
import { CategoryIcon } from './WishCard';
import { remaining, shortDate, won, type Status, type Wish } from '../model';

interface Props {
  item: Wish;
  now: number;
  saving: boolean;
  onDecide: (status: Exclude<Status, 'waiting'>) => void;
  onPostpone: () => void;
  onDelete: () => void;
  onRate: (rating: number) => void;
}
export function Detail({ item, now, saving, onDecide, onPostpone, onDelete, onRate }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ready = item.reviewAt <= now;
  return (
    <div className="detail">
      <div className="detail-heading">
        <CategoryIcon category={item.category} />
        <div>
          <span className="eyebrow">
            {item.category} · {shortDate(item.createdAt)}에 맡겼어요
          </span>
          <h3>{item.name}</h3>
          <p>{won(item.price)}</p>
        </div>
      </div>
      <div className="reflection-note">
        <span className="eyebrow">처음 갖고 싶었던 이유</span>
        <p>{item.reason || '따로 적어 둔 이유가 없어요.'}</p>
        {item.similar !== 'unsure' && (
          <p className="detail-answer">
            비슷한 물건이 {item.similar === 'yes' ? '이미 있어요.' : '없어요.'}
          </p>
        )}
        {item.usePlan && <p className="detail-answer">사용 계획: {item.usePlan}</p>}
      </div>
      {item.status === 'waiting' ? (
        <>
          <div className={`review-message ${ready ? 'review-ready' : ''}`}>
            <Clock3 size={19} />
            <div>
              <strong>
                {ready ? '기다려 본 지금, 어떤 마음인가요?' : remaining(item.reviewAt, now)}
              </strong>
              <p>
                {ready
                  ? '사도, 사지 않아도 괜찮아요. 내 마음을 기록해 봐요.'
                  : '기다리는 동안 다른 물건을 비교하거나 사용 계획을 생각해 보세요.'}
              </p>
            </div>
          </div>
          <div className="decision-actions">
            <Button
              size="large"
              variant="weak"
              display="full"
              disabled={!ready || saving}
              onClick={() => onDecide('bought')}
            >
              구매했어요
            </Button>
            <Button
              size="large"
              display="full"
              disabled={!ready || saving}
              onClick={() => onDecide('skipped')}
            >
              안 사기로 했어요
            </Button>
          </div>
          <button className="text-button full" disabled={saving} onClick={onPostpone}>
            하루 더 생각해 볼게요
          </button>
        </>
      ) : (
        <>
          <div className="completed-note">
            <strong>
              {item.status === 'skipped'
                ? '내게 필요하지 않은 소비를 한 번 걸렀어요.'
                : '충분히 생각하고 내린 결정을 남겼어요.'}
            </strong>
            <p>
              {shortDate(item.decidedAt!)}에{' '}
              {item.status === 'skipped' ? '안 사기로' : '구매했다고'} 기록했어요.
            </p>
          </div>
          {item.status === 'bought' && (
            <fieldset className="rating">
              <legend>써 보니 얼마나 만족하나요?</legend>
              <div>
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    aria-label={`만족도 ${value}점`}
                    aria-pressed={item.satisfaction === value}
                    disabled={saving}
                    onClick={() => onRate(value)}
                  >
                    <Star
                      size={30}
                      fill={(item.satisfaction ?? 0) >= value ? '#e8b766' : 'none'}
                      color={(item.satisfaction ?? 0) >= value ? '#cc943c' : '#c5c9c4'}
                    />
                  </button>
                ))}
              </div>
              <p>
                {item.satisfaction
                  ? `${item.satisfaction}점으로 기록했어요`
                  : '구매 후 만족도를 남겨 보세요'}
              </p>
            </fieldset>
          )}
          <button className="text-button full" disabled={saving} onClick={onPostpone}>
            결정을 되돌리고 하루 더 생각하기
          </button>
        </>
      )}
      {confirmDelete ? (
        <div className="delete-confirm" role="alert">
          <p>
            이 물건과 결정 기록을 삭제할까요?
            <br />
            <span>월간 통계에서도 제외돼요. 되돌릴 수 없어요.</span>
          </p>
          <div>
            <button className="text-button" onClick={() => setConfirmDelete(false)}>
              취소
            </button>
            <Button color="danger" size="small" disabled={saving} onClick={onDelete}>
              삭제하기
            </Button>
          </div>
        </div>
      ) : (
        <button className="delete-link" onClick={() => setConfirmDelete(true)} disabled={saving}>
          <Trash2 size={15} />이 기록 삭제
        </button>
      )}
    </div>
  );
}
