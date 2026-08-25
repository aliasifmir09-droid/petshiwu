import { useEffect, useState } from 'react';
import { Heart, PawPrint, X } from 'lucide-react';

export const CHECKOUT_CHARITY_PRESETS = [1, 3, 5, 10] as const;

const GIFT_LABELS: Record<(typeof CHECKOUT_CHARITY_PRESETS)[number], string> = {
  1: 'a treat',
  3: 'a meal',
  5: 'a cozy bed',
  10: "a week's care"
};

const MIN_CUSTOM_DONATION = 1;
const MAX_CUSTOM_DONATION = 500;
const PET_PARENT_FONT = "'Nunito', 'Segoe UI', sans-serif";

interface CheckoutCharityCardProps {
  amount: number;
  onChange: (amount: number) => void;
}

const isPreset = (value: number) =>
  CHECKOUT_CHARITY_PRESETS.some((preset) => preset === value);

const SleepingPetMark = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 78 46"
    className="pointer-events-none absolute right-1.5 top-1.5 h-12 w-[4.75rem] text-rose-200"
  >
    <ellipse cx="42" cy="30" rx="26" ry="13" fill="currentColor" />
    <path
      fill="currentColor"
      d="M18 28c1-11 10-18 24-18 7 0 13 2 17 6l5-10 5 9 6-8 3 11c3 3 5 7 5 11 0 8-12 13-31 13-16 0-29-4-29-14z"
    />
    <path fill="#fda4af" d="M28 12l-6-8 10 5 4 7zM48 10l8-9-2 11-6 4z" />
    <circle cx="36" cy="26" r="1.7" fill="#9f1239" />
    <circle cx="46" cy="26" r="1.7" fill="#9f1239" />
    <path
      d="M38 31c3 2 8 2 11 0"
      fill="none"
      stroke="#9f1239"
      strokeLinecap="round"
      strokeWidth="1.5"
    />
  </svg>
);

const CheckoutCharityCard = ({ amount, onChange }: CheckoutCharityCardProps) => {
  const [showCustom, setShowCustom] = useState(amount > 0 && !isPreset(amount));
  const [customValue, setCustomValue] = useState(
    amount > 0 && !isPreset(amount) ? amount.toFixed(2) : ''
  );

  useEffect(() => {
    if (amount <= 0) {
      setShowCustom(false);
      setCustomValue('');
      return;
    }
    if (!isPreset(amount)) {
      setShowCustom(true);
      setCustomValue(amount.toFixed(2));
    }
  }, [amount]);

  const applyCustomAmount = (raw: string) => {
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      onChange(0);
      return;
    }
    const next = Number(Math.min(MAX_CUSTOM_DONATION, Math.max(MIN_CUSTOM_DONATION, parsed)).toFixed(2));
    onChange(next);
  };

  const selectPreset = (value: number) => {
    setShowCustom(false);
    setCustomValue('');
    onChange(amount === value ? 0 : value);
  };

  return (
    <section
      aria-label="Optional donation to animal rescue"
      className="relative overflow-hidden rounded-[1.4rem] border border-rose-100/90 p-4 sm:p-[1.15rem]"
      style={{
        fontFamily: PET_PARENT_FONT,
        background:
          'linear-gradient(160deg, #fff7f5 0%, #fff 42%, #fff4e6 100%)',
        boxShadow: '0 16px 34px -22px rgba(159, 18, 57, 0.45), inset 0 1px 0 rgba(255,255,255,0.9)'
      }}
    >
      <SleepingPetMark />
      <PawPrint
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-3 -left-2 h-16 w-16 -rotate-12 text-amber-200/50"
      />

      <div className="relative">
        <div className="mb-3.5 flex items-start gap-3 pr-14">
          <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 via-pink-500 to-orange-400 shadow-[0_8px_18px_-8px_rgba(244,63,94,0.9)]">
            <Heart className="text-white" size={20} fill="currentColor" />
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-rose-100">
              <PawPrint className="text-rose-500" size={11} fill="currentColor" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[1.05rem] font-extrabold leading-tight tracking-tight text-stone-800">
                From one pet parent to another
              </h3>
              <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-rose-600 ring-1 ring-rose-100">
                Optional
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-snug text-stone-600">
              The same love you give your pet can help one still waiting for a home.
            </p>
          </div>
        </div>

        {amount > 0 && (
          <div className="mb-3 flex items-start justify-between gap-2 rounded-2xl bg-white/95 px-3 py-2.5 shadow-sm ring-1 ring-rose-100">
            <div className="min-w-0">
              <p className="text-sm font-extrabold leading-snug text-rose-600">
                Thank you, pet parent.
              </p>
              <p className="text-sm font-semibold leading-snug text-stone-700">
                ${amount.toFixed(2)} will help a shelter pet rest tonight.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onChange(0)}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-stone-500 hover:bg-rose-50 hover:text-stone-800"
              aria-label="Remove donation"
            >
              <X size={14} />
              Not now
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Donation amounts">
          {CHECKOUT_CHARITY_PRESETS.map((preset) => {
            const selected = amount === preset && !showCustom;
            return (
              <button
                key={preset}
                type="button"
                aria-pressed={selected}
                aria-label={`Donate $${preset} to animal rescue`}
                onClick={() => selectPreset(preset)}
                className={`group flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition-all duration-200 ${
                  selected
                    ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-[0_10px_18px_-10px_rgba(244,63,94,0.95)] ring-2 ring-white'
                    : 'bg-white text-stone-800 shadow-sm ring-1 ring-rose-100 hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-md hover:ring-rose-200'
                }`}
              >
                <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                  selected ? 'bg-white/20' : 'bg-rose-50'
                }`}>
                  {selected ? (
                    <Heart size={14} fill="currentColor" className="text-white" />
                  ) : (
                    <PawPrint size={14} className="text-rose-400 group-hover:text-rose-500" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-black leading-none">${preset}</span>
                  <span className={`mt-1 block text-[11px] font-bold leading-tight ${selected ? 'text-rose-100' : 'text-stone-500'}`}>
                    {GIFT_LABELS[preset]}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          aria-pressed={showCustom}
          onClick={() => {
            const next = !showCustom;
            setShowCustom(next);
            if (!next && !isPreset(amount)) onChange(0);
          }}
          className="mt-3 w-full text-center text-sm font-semibold text-stone-500 underline-offset-4 hover:text-rose-600 hover:underline"
        >
          {showCustom ? 'Hide other amount' : 'Give a different amount'}
        </button>

        {showCustom && (
          <div className="mt-2">
            <label htmlFor="checkout-charity-custom" className="sr-only">
              Custom donation amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-extrabold text-rose-400">
                $
              </span>
              <input
                id="checkout-charity-custom"
                type="number"
                min={MIN_CUSTOM_DONATION}
                max={MAX_CUSTOM_DONATION}
                step="0.01"
                inputMode="decimal"
                value={customValue}
                placeholder="Your gift"
                onChange={(event) => setCustomValue(event.target.value)}
                onBlur={(event) => applyCustomAmount(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    applyCustomAmount(customValue);
                  }
                }}
                className="w-full rounded-2xl border border-rose-200 bg-white py-2.5 pl-7 pr-3 text-sm font-bold text-stone-800 outline-none placeholder:font-semibold placeholder:text-stone-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
              />
            </div>
          </div>
        )}

        <p className="mt-3 text-[11px] leading-relaxed text-stone-500">
          Goes to NYC animal shelters and rescue groups. Skip anytime — no pressure.
        </p>
      </div>
    </section>
  );
};

export default CheckoutCharityCard;
