import { useState, type FormEvent } from 'react';
import { Button } from '@toss/tds-mobile';
import { Clock3 } from 'lucide-react';
import { CATEGORIES, type Category, type Similar, type WishInput } from '../model';

export function WishForm({
  onSave,
  saving,
}: {
  onSave: (input: WishInput) => Promise<void>;
  saving: boolean;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<Category>('기타');
  const [reason, setReason] = useState('');
  const [usePlan, setUsePlan] = useState('');
  const [similar, setSimilar] = useState<Similar>('unsure');
  const [hours, setHours] = useState(24);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await onSave({ name, price: Number(price), category, reason, similar, usePlan, hours });
    } catch (err) {
      setError(err instanceof Error ? err.message : '다시 입력해 주세요.');
    }
  }
  return (
    <form onSubmit={submit} className="wish-form">
      <p className="form-intro">갖고 싶은 마음은 그대로, 결정은 조금 천천히.</p>
      <label className="field">
        어떤 물건이 갖고 싶나요?
        <input
          autoFocus
          required
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="예: 매일 들고 다닐 가방"
          autoComplete="off"
        />
      </label>
      <label className="field">
        가격
        <div className="price-input">
          <input
            required
            inputMode="numeric"
            pattern="[0-9]+"
            value={price}
            onChange={(event) => setPrice(event.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
            placeholder="0"
            aria-label="가격"
          />
          <span>원</span>
        </div>
      </label>
      <fieldset>
        <legend>카테고리</legend>
        <div className="choice-row">
          {CATEGORIES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={category === value}
              className={`choice ${category === value ? 'selected' : ''}`}
              onClick={() => setCategory(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="field">
        갖고 싶은 이유 <span className="optional">선택</span>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={300}
          rows={2}
          placeholder="나중의 나에게 짧게 남겨 주세요"
        />
      </label>
      <details className="reflection-fields">
        <summary>
          잠깐, 두 가지만 더 생각해 볼까요? <span>선택</span>
        </summary>
        <fieldset>
          <legend>이미 비슷한 물건이 있나요?</legend>
          <div className="choice-row">
            {(
              [
                ['yes', '있어요'],
                ['no', '없어요'],
                ['unsure', '잘 모르겠어요'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`choice ${similar === value ? 'selected' : ''}`}
                aria-pressed={similar === value}
                onClick={() => setSimilar(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="field">
          언제, 어떻게 쓸 예정인가요?
          <input
            value={usePlan}
            onChange={(event) => setUsePlan(event.target.value)}
            maxLength={200}
            placeholder="예: 다음 달 여행에서 쓸 거예요"
          />
        </label>
      </details>
      <fieldset>
        <legend className="with-icon">
          <Clock3 size={17} />
          얼마나 기다려 볼까요?
        </legend>
        <div className="duration-row">
          {(
            [
              [24, '하루', '24시간'],
              [48, '이틀', '48시간'],
              [168, '일주일', '7일'],
            ] as const
          ).map(([value, label, description]) => (
            <button
              key={value}
              type="button"
              className={`duration ${hours === value ? 'selected' : ''}`}
              aria-pressed={hours === value}
              onClick={() => setHours(value)}
            >
              <strong>{label}</strong>
              <span>{description}</span>
            </button>
          ))}
        </div>
      </fieldset>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <Button
        type="submit"
        aria-label="보관함에 맡기기"
        size="large"
        display="full"
        loading={saving}
        disabled={saving}
      >
        보관함에 맡기기
      </Button>
      <p className="small-note">선택한 시간이 지나면 구매 여부를 기록할 수 있어요.</p>
    </form>
  );
}
