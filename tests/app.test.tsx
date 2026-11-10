import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider } from '../src/components/AppProvider';
import { describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import { createWish, HOUR, monthKey, type Wish } from '../src/model';
import type { Repository } from '../src/storage';

function memory(initial: Wish[] = []) {
  let records = structuredClone(initial);
  const repo: Repository = {
    read: async () => records,
    write: vi.fn(async (items) => {
      records = structuredClone(items);
    }),
  };
  return { factory: async () => repo, repo, records: () => records };
}
function show(factory: () => Promise<Repository>) {
  return render(
    <AppProvider>
      <App repositoryFactory={factory} />
    </AppProvider>,
  );
}
const oldItem = () =>
  createWish(
    {
      name: '여행용 가방',
      price: 89000,
      category: '패션',
      reason: '여행 갈 때 쓰려고',
      similar: 'yes',
      usePlan: '',
      hours: 24,
    },
    Date.now() - 25 * HOUR,
  );

describe('complete app flows', () => {
  it('adds a wish, saves it, and keeps purchase decisions locked during the waiting period', async () => {
    const store = memory();
    const user = userEvent.setup();
    show(store.factory);
    await user.click(await screen.findByRole('button', { name: '물건 맡기기' }));
    await user.type(screen.getByLabelText('어떤 물건이 갖고 싶나요?'), '무선 키보드');
    await user.type(screen.getByRole('textbox', { name: '가격' }), '120000');
    await user.click(screen.getByRole('button', { name: '보관함에 맡기기' }));
    await screen.findByRole('button', { name: '무선 키보드 상세 보기' });
    expect(store.records()).toHaveLength(1);
    expect(store.records()[0].price).toBe(120000);
    await user.click(screen.getByRole('button', { name: '무선 키보드 상세 보기' }));
    expect(screen.getByRole('button', { name: '구매했어요' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '안 사기로 했어요' })).toBeDisabled();
  });
  it('records a skipped purchase, updates monthly totals, and restores it without double counting', async () => {
    const store = memory([oldItem()]);
    const user = userEvent.setup();
    show(store.factory);
    await user.click(await screen.findByRole('button', { name: '여행용 가방 상세 보기' }));
    await user.click(screen.getByRole('button', { name: '안 사기로 했어요' }));
    await waitFor(() => expect(store.records()[0].status).toBe('skipped'));
    expect(screen.getByText('89,000원')).toBeVisible();
    await user.click(
      within(screen.getByRole('navigation', { name: '주 메뉴' })).getByRole('button', {
        name: '소비 기록',
      }),
    );
    await user.click(screen.getByRole('button', { name: '여행용 가방 상세 보기' }));
    await user.click(screen.getByRole('button', { name: '결정을 되돌리고 하루 더 생각하기' }));
    await waitFor(() => expect(store.records()[0].status).toBe('waiting'));
    expect(store.records()[0].decidedAt).toBeNull();
    expect(store.records()[0].reviewAt).toBeGreaterThan(Date.now() + 23 * HOUR);
  });
  it('preserves form and old state when writing fails, and can retry successfully', async () => {
    const store = memory();
    vi.mocked(store.repo.write).mockRejectedValueOnce(new Error('저장 공간이 부족해요.'));
    const user = userEvent.setup();
    show(store.factory);
    await user.click(await screen.findByRole('button', { name: '물건 맡기기' }));
    await user.type(screen.getByLabelText('어떤 물건이 갖고 싶나요?'), '책상 조명');
    await user.type(screen.getByRole('textbox', { name: '가격' }), '35000');
    await user.click(screen.getByRole('button', { name: '보관함에 맡기기' }));
    expect(
      await screen.findByText('저장되지 않았어요. 창을 닫기 전에 다시 시도해 주세요.'),
    ).toBeVisible();
    expect(screen.getByLabelText('어떤 물건이 갖고 싶나요?')).toHaveValue('책상 조명');
    expect(store.records()).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: '보관함에 맡기기' }));
    await screen.findByRole('button', { name: '책상 조명 상세 보기' });
    expect(store.records()).toHaveLength(1);
  });
  it('deletes only after confirmation and removes the record from monthly statistics', async () => {
    const item = { ...oldItem(), status: 'skipped' as const, decidedAt: Date.now() };
    const store = memory([item]);
    const user = userEvent.setup();
    show(store.factory);
    await screen.findByText('89,000원');
    await user.click(
      within(screen.getByRole('navigation', { name: '주 메뉴' })).getByRole('button', {
        name: '소비 기록',
      }),
    );
    await user.click(screen.getByRole('button', { name: '여행용 가방 상세 보기' }));
    await user.click(screen.getByRole('button', { name: '이 기록 삭제' }));
    expect(store.records()).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: '삭제하기' }));
    await waitFor(() => expect(store.records()).toHaveLength(0));
    expect(monthKey(item.decidedAt)).toBe(monthKey(Date.now()));
  });
});
