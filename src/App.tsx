import { useEffect, useState } from 'react';
import { Button } from '@toss/tds-mobile';
import {
  ArrowRight,
  Bookmark,
  ChartNoAxesColumnIncreasing,
  Check,
  Clock3,
  Info,
  Leaf,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import {
  createWish,
  decideWish,
  monthKey,
  monthlySummary,
  postponeWish,
  won,
  type Status,
  type WishInput,
} from './model';
import { createRepository, isTossWebView } from './storage';
import { useWishes } from './useWishes';
import { Modal } from './components/Modal';
import { WishForm } from './components/WishForm';
import { WishCard } from './components/WishCard';
import { Detail } from './components/Detail';
import { Illustration } from './components/Illustration';
import { MonthlyReview } from './components/MonthlyReview';

type Page = 'shelf' | 'journal' | 'review';
const PAGES = [
  { key: 'shelf', label: '보관함', icon: Bookmark },
  { key: 'journal', label: '소비 기록', icon: ShoppingBag },
  { key: 'review', label: '월간 돌아보기', icon: ChartNoAxesColumnIncreasing },
] as const;

export default function App({
  repositoryFactory = createRepository,
}: {
  repositoryFactory?: typeof createRepository;
}) {
  const store = useWishes(repositoryFactory);
  const [page, setPage] = useState<Page>('shelf');
  const [adding, setAdding] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [information, setInformation] = useState(false);
  const [filter, setFilter] = useState<'all' | 'ready'>('all');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'bought' | 'skipped'>('all');
  const [query, setQuery] = useState('');
  const [now, setNow] = useState(Date.now());
  const [month, setMonth] = useState(monthKey(Date.now()));
  const [toast, setToast] = useState('');
  const active = store.items.find((item) => item.id === activeId);
  const waiting = store.items.filter((item) => item.status === 'waiting');
  const readyCount = waiting.filter((item) => item.reviewAt <= now).length;
  const summary = monthlySummary(store.items, monthKey(now));
  const greetingMonth = Number(monthKey(now).slice(5));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    const update = () => {
      if (!document.hidden) setNow(Date.now());
    };
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // The latest handler is installed once per screen state. No bridge polling.
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    if (!isTossWebView()) return;
    import('@apps-in-toss/web-framework')
      .then(({ graniteEvent, Screen }) => {
        if (cancelled) return;
        unsubscribe = graniteEvent.addEventListener('backEvent', {
          onEvent: () => {
            if (adding) setAdding(false);
            else if (activeId) setActiveId(null);
            else if (information) setInformation(false);
            else if (page !== 'shelf') setPage('shelf');
            else
              void Screen.close().catch(() => setToast('화면 위의 닫기 버튼으로 종료해 주세요.'));
          },
        });
      })
      .catch(() => {
        /* Ordinary web browsers have no native back-event bridge. */
      });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [adding, activeId, information, page]);

  async function add(input: WishInput) {
    const item = createWish(input);
    if (await store.update((previous) => [item, ...previous])) {
      setAdding(false);
      setPage('shelf');
      setFilter('all');
      setQuery('');
      setToast('사고 싶은 마음을 잘 맡겨뒀어요.');
    }
  }
  async function decide(status: Exclude<Status, 'waiting'>) {
    if (!active) return;
    if (
      await store.update((previous) =>
        previous.map((item) => (item.id === active.id ? decideWish(item, status) : item)),
      )
    ) {
      setActiveId(null);
      setToast(
        status === 'skipped' ? '안 사기로 한 마음을 기록했어요.' : '구매 결정을 기록했어요.',
      );
    }
  }
  async function postpone() {
    if (!active) return;
    if (
      await store.update((previous) =>
        previous.map((item) => (item.id === active.id ? postponeWish(item) : item)),
      )
    ) {
      setActiveId(null);
      setToast('하루 더 생각할 시간을 만들었어요.');
    }
  }
  async function remove() {
    if (await store.update((previous) => previous.filter((item) => item.id !== activeId))) {
      setActiveId(null);
      setToast('기록을 삭제했어요.');
    }
  }
  const navigate = (next: Page) => {
    setPage(next);
    setQuery('');
    window.scrollTo?.({ top: 0 });
  };
  const visible = store.items
    .filter((item) => {
      if (
        page === 'shelf' &&
        (item.status !== 'waiting' || (filter === 'ready' && item.reviewAt > now))
      )
        return false;
      if (
        page === 'journal' &&
        (item.status === 'waiting' || (historyFilter !== 'all' && item.status !== historyFilter))
      )
        return false;
      return `${item.name} ${item.category} ${item.reason}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase().trim());
    })
    .sort((a, b) =>
      page === 'shelf' ? a.reviewAt - b.reviewAt : (b.decidedAt ?? 0) - (a.decidedAt ?? 0),
    );

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        본문으로 건너뛰기
      </a>
      <header className="app-header">
        <div className="header-inner">
          <button
            className="brand"
            onClick={() => navigate('shelf')}
            aria-label="살까 말까 보관함 홈"
          >
            <span className="brand-icon">
              <ShoppingBag size={22} />
              <span />
            </span>
            <span>
              살까 말까<span className="brand-subtitle">보관함</span>
            </span>
          </button>
          <nav className="desktop-nav" aria-label="주 메뉴">
            {PAGES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                aria-current={page === key ? 'page' : undefined}
                onClick={() => navigate(key)}
                className={page === key ? 'active' : ''}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </nav>
          <button
            className="icon-button info-button"
            aria-label="이용 안내"
            onClick={() => setInformation(true)}
          >
            <Info size={21} />
          </button>
        </div>
      </header>
      <main id="main" className="main-content" tabIndex={-1}>
        {store.error && (
          <div className="error-banner" role="alert">
            <div>
              <strong>기록을 {store.ready ? '저장' : '불러오'}지 못했어요.</strong>
              <p>{store.error}</p>
            </div>
            {!store.ready && (
              <button onClick={store.retry} className="text-button">
                다시 시도
              </button>
            )}
          </div>
        )}
        {store.loading ? (
          <div className="loading-state" role="status">
            <span className="loader" />
            <p>맡겨 둔 마음을 꺼내고 있어요.</p>
          </div>
        ) : (
          <>
            {page === 'review' ? (
              <MonthlyReview items={store.items} month={month} onMonth={setMonth} />
            ) : (
              <>
                {page === 'shelf' ? (
                  <>
                    <section className="hero">
                      <div className="hero-copy">
                        <div className="hero-kicker">
                          <span />
                          사려던 마음에, 작은 쉼표
                        </div>
                        <h1>
                          사고 싶은 마음,
                          <br />
                          <span>잠깐 맡겨두세요.</span>
                        </h1>
                        <p>
                          하루 뒤에도 갖고 싶을까요?
                          <br className="mobile-break" /> 나에게 꼭 필요한 소비인지 천천히 생각해요.
                        </p>
                        <Button
                          size="large"
                          disabled={!store.ready}
                          onClick={() => setAdding(true)}
                        >
                          <Plus size={18} />
                          물건 맡기기
                        </Button>
                      </div>
                      <div className="hero-art">
                        <Illustration />
                        <span className="art-caption">
                          <Clock3 size={13} />
                          결정은 천천히, 마음은 가볍게
                        </span>
                      </div>
                    </section>
                    <section className="shelf-summary" aria-label="이번 달 기록">
                      <div className="summary-main">
                        <span className="summary-icon">
                          <Leaf size={22} />
                        </span>
                        <div>
                          <span className="summary-label">
                            {greetingMonth}월, 안 사기로 한 금액
                          </span>
                          <strong>{won(summary.saved)}</strong>
                        </div>
                      </div>
                      <button className="summary-link" onClick={() => navigate('review')}>
                        <span>
                          {summary.skippedCount
                            ? `${summary.skippedCount}번의 현명한 멈춤`
                            : '나의 작은 멈춤을 모아봐요'}
                        </span>
                        <ArrowRight size={18} />
                      </button>
                    </section>
                  </>
                ) : (
                  <section className="section-intro">
                    <span className="eyebrow">MY LITTLE DECISIONS</span>
                    <h1>
                      사기로 한 마음도,
                      <br />
                      놓아준 마음도.
                    </h1>
                    <p>충분히 고민한 나의 소비 기록이에요.</p>
                  </section>
                )}
                <section className="shelf-section" aria-labelledby="list-title">
                  <div className="list-title-row">
                    <h2 id="list-title">
                      {page === 'shelf' ? '나의 보관함' : '나의 소비 기록'}{' '}
                      <span>
                        {page === 'shelf' ? waiting.length : store.items.length - waiting.length}
                      </span>
                    </h2>
                    {page === 'shelf' && (
                      <button
                        className="text-button add-text"
                        onClick={() => setAdding(true)}
                        disabled={!store.ready}
                      >
                        <Plus size={16} />
                        새로 맡기기
                      </button>
                    )}
                  </div>
                  <div className="list-toolbar">
                    <div className="filters" aria-label="기록 필터">
                      {page === 'shelf' ? (
                        <>
                          <button
                            aria-pressed={filter === 'all'}
                            className={filter === 'all' ? 'selected' : ''}
                            onClick={() => setFilter('all')}
                          >
                            전체
                          </button>
                          <button
                            aria-pressed={filter === 'ready'}
                            className={filter === 'ready' ? 'selected' : ''}
                            onClick={() => setFilter('ready')}
                          >
                            결정할 시간 <span>{readyCount}</span>
                          </button>
                        </>
                      ) : (
                        (['all', 'bought', 'skipped'] as const).map((value) => (
                          <button
                            key={value}
                            aria-pressed={historyFilter === value}
                            className={historyFilter === value ? 'selected' : ''}
                            onClick={() => setHistoryFilter(value)}
                          >
                            {value === 'all'
                              ? '전체'
                              : value === 'bought'
                                ? '구매했어요'
                                : '안 사기로 했어요'}
                          </button>
                        ))
                      )}
                    </div>
                    <label className="search-input">
                      <Search size={17} />
                      <input
                        aria-label="기록 검색"
                        placeholder="물건 이름으로 검색"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                      />
                    </label>
                  </div>
                  {visible.length ? (
                    <div className="wish-grid">
                      {visible.map((item) => (
                        <WishCard
                          key={item.id}
                          item={item}
                          now={now}
                          onOpen={() => {
                            setNow(Date.now());
                            setActiveId(item.id);
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <Illustration small />
                      <h3>
                        {query
                          ? '찾는 물건이 없어요'
                          : page === 'journal'
                            ? '아직 결정한 기록이 없어요'
                            : filter === 'ready'
                              ? '지금은 천천히 생각하는 시간'
                              : '첫 번째 마음을 맡겨볼까요?'}
                      </h3>
                      <p>
                        {query
                          ? '다른 이름이나 카테고리로 검색해 보세요.'
                          : page === 'journal'
                            ? '기다림이 끝난 물건의 구매 여부를 남겨 보세요.'
                            : filter === 'ready'
                              ? '정해 둔 시간이 지나면 이곳에서 다시 만나요.'
                              : '장바구니에 담기 전에, 여기 잠깐 두어도 좋아요.'}
                      </p>
                      {!query && page === 'shelf' && filter === 'all' && (
                        <button
                          className="empty-add"
                          disabled={!store.ready}
                          onClick={() => setAdding(true)}
                        >
                          <Plus size={17} />첫 물건 맡기기
                        </button>
                      )}
                    </div>
                  )}
                </section>
                {page === 'shelf' && (
                  <aside className="gentle-tip">
                    <span className="tip-icon">
                      <Clock3 size={22} />
                    </span>
                    <div>
                      <strong>기다리는 것도 나를 위한 선택이에요.</strong>
                      <p>지금 사지 않아도 괜찮아요. 하루 뒤의 나에게 한 번 더 물어보세요.</p>
                    </div>
                  </aside>
                )}
              </>
            )}
            <footer className="app-footer">
              <ShieldCheck size={14} />
              <span>기록은 이 기기에 저장돼요.</span>
              <button onClick={() => setInformation(true)}>이용 안내</button>
            </footer>
          </>
        )}
      </main>
      <nav className="mobile-nav" aria-label="모바일 메뉴">
        {PAGES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            aria-current={page === key ? 'page' : undefined}
            className={page === key ? 'active' : ''}
            onClick={() => navigate(key)}
          >
            <Icon size={21} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {adding && (
        <Modal title="사고 싶은 물건 맡기기" onClose={() => !store.saving && setAdding(false)}>
          <WishForm onSave={add} saving={store.saving} />
          {store.error && (
            <p className="form-error" role="alert">
              저장되지 않았어요. 창을 닫기 전에 다시 시도해 주세요.
            </p>
          )}
        </Modal>
      )}
      {active && (
        <Modal title="내 마음 다시 보기" onClose={() => !store.saving && setActiveId(null)}>
          <Detail
            item={active}
            now={now}
            saving={store.saving}
            onDecide={decide}
            onPostpone={postpone}
            onDelete={remove}
            onRate={(rating) => {
              void store.update((previous) =>
                previous.map((item) =>
                  item.id === active.id ? { ...item, satisfaction: rating } : item,
                ),
              );
            }}
          />
          {store.error && (
            <p className="form-error" role="alert">
              변경 내용을 저장하지 못했어요. 다시 시도해 주세요.
            </p>
          )}
        </Modal>
      )}
      {information && (
        <Modal title="조금 더 편하게 이용해요" onClose={() => setInformation(false)}>
          <div className="info-content">
            <div className="info-lead">
              <Leaf size={25} />
              <p>
                소비를 참는 것보다,
                <br />
                <strong>나에게 필요한 선택을 하는 것.</strong>
              </p>
            </div>
            <h3>어떻게 사용하나요?</h3>
            <ol>
              <li>사고 싶은 물건과 가격을 적고 기다릴 시간을 골라요.</li>
              <li>정한 시간이 지나면 구매 여부를 기록해요.</li>
              <li>소비 기록과 월간 돌아보기에서 내 선택을 확인해요.</li>
            </ol>
            <h3>기록은 어디에 저장되나요?</h3>
            <p>
              토스에서는 사용자별 기기 저장소에, 일반 브라우저에서는 해당 브라우저에 저장돼요.
              서버로 전송하거나 다른 기기로 동기화하지 않아요. 앱 삭제나 브라우저 데이터 삭제 시
              기록이 사라질 수 있어요.
            </p>
            <h3>금액은 어떻게 계산하나요?</h3>
            <p>
              ‘안 사기로 한 금액’은 직접 입력한 물건 가격의 합계예요. 실제 저축액이나 계좌 잔액이
              아니에요. 결정을 되돌리거나 기록을 삭제하면 통계에도 반영돼요. 월 구분은 한국 시간,
              결정한 날짜를 기준으로 해요.
            </p>
            <h3>개인정보와 권한</h3>
            <p>
              이름·연락처·계좌·카드 정보와 광고 식별자는 수집하지 않아요. 토스에서는 사용자 기록을
              구분하는 익명 식별키만 기기 안에서 사용해요. 기록 삭제는 각 물건의 상세 화면에서 할 수
              있어요.
            </p>
            <Button display="full" size="large" onClick={() => setInformation(false)}>
              알겠어요
            </Button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
