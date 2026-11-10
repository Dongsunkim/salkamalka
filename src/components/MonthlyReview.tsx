import { ChevronLeft, ChevronRight, Leaf, ShoppingBag, CircleCheck } from 'lucide-react';
import { CATEGORIES, monthKey, monthlySummary, won, type Wish } from '../model';

export function MonthlyReview({
  items,
  month,
  onMonth,
}: {
  items: Wish[];
  month: string;
  onMonth: (month: string) => void;
}) {
  const summary = monthlySummary(items, month);
  const [year, monthNumber] = month.split('-').map(Number);
  const change = (delta: number) => {
    const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
    onMonth(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`);
  };
  const decisions = items.filter(
    (item) => item.decidedAt !== null && monthKey(item.decidedAt) === month,
  );
  const ratings = decisions.filter(
    (item) => item.status === 'bought' && item.satisfaction !== null,
  );
  return (
    <section className="monthly-review">
      <div className="section-intro">
        <span className="eyebrow">MY CONSUMPTION JOURNAL</span>
        <h1>
          천천히 고른 마음을
          <br />
          돌아봐요.
        </h1>
        <p>작은 멈춤이 내 소비를 어떻게 바꿨을까요?</p>
      </div>
      <div className="month-picker">
        <button className="icon-button" aria-label="지난달" onClick={() => change(-1)}>
          <ChevronLeft size={21} />
        </button>
        <h2>
          {year}년 {monthNumber}월
        </h2>
        <button
          className="icon-button"
          aria-label="다음 달"
          disabled={month >= monthKey(Date.now())}
          onClick={() => change(1)}
        >
          <ChevronRight size={21} />
        </button>
      </div>
      <div className="monthly-main">
        <div className="round-icon">
          <Leaf size={25} />
        </div>
        <p>안 사기로 한 물건의 금액</p>
        <strong>{won(summary.saved)}</strong>
        <span>{summary.skippedCount}번의 결정을 차곡차곡 모았어요.</span>
      </div>
      <div className="review-stats">
        <article>
          <CircleCheck size={21} />
          <span>기록한 결정</span>
          <strong>
            {summary.total}
            <small>번</small>
          </strong>
        </article>
        <article>
          <ShoppingBag size={21} />
          <span>구매한 물건</span>
          <strong>
            {summary.boughtCount}
            <small>개</small>
          </strong>
        </article>
        <article>
          <Leaf size={21} />
          <span>구매 기록 금액</span>
          <strong>{won(summary.spent)}</strong>
        </article>
      </div>
      <div className="review-panel">
        <h3>어떤 물건을 고민했나요?</h3>
        {summary.total ? (
          <div className="category-chart">
            {CATEGORIES.map((category) => {
              const count = decisions.filter((item) => item.category === category).length;
              return (
                <div className="chart-row" key={category}>
                  <span>{category}</span>
                  <div className="chart-track">
                    <div style={{ width: `${(count / summary.total) * 100}%` }} />
                  </div>
                  <strong>{count}개</strong>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="review-empty">
            <Leaf size={27} />
            <p>이번 달에는 아직 결정한 기록이 없어요.</p>
            <span>숙려 후 구매 여부를 남기면 여기에 모아 드려요.</span>
          </div>
        )}
      </div>
      {ratings.length > 0 && (
        <div className="review-panel">
          <h3>구매 후 만족도</h3>
          <p className="satisfaction-average">
            {(ratings.reduce((sum, item) => sum + item.satisfaction!, 0) / ratings.length).toFixed(
              1,
            )}
            <span> / 5점</span>
          </p>
          <p className="muted">만족도를 남긴 {ratings.length}개 물건의 평균이에요.</p>
        </div>
      )}
      <p className="data-note">
        직접 입력한 가격과 결정 기록을 기준으로 계산해요. 실제 계좌 잔액이나 저축액을 의미하지
        않아요. 월 구분은 한국 시간을 기준으로 해요.
      </p>
    </section>
  );
}
