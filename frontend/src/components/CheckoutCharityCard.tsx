import { useEffect, useState } from 'react';
import { HeartHandshake, PawPrint, X } from 'lucide-react';

export const CHECKOUT_CHARITY_PRESETS = [1, 3, 5, 10] as const;
const MIN_CUSTOM_DONATION = 1;
const MAX_CUSTOM_DONATION = 500;

interface CheckoutCharityCardProps {
  amount: number;
  onChange: (amount: number) => void;
}

const isPreset = (value: number) =>
  CHECKOUT_CHARITY_PRESETS.some((preset) => preset === value);

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
      className="relative overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-amber-50/70 p-4 shadow-[0_10px_30px_-18px_rgba(190,24,93,0.45)]"
    >
      <PawPrint
        aria-hidden="true"
        className="pointer-events-none absolute -right-3 -top-3 h-24 w-24 rotate-12 text-rose-200/50"
      />

      <div className="relative">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-md shadow-rose-200">
            <HeartHandshake className="text-white" size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold tracking-tight text-gray-900">
                Help a shelter pet
              </h3>
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700 ring-1 ring-rose-100">
                Optional
              </span>
            </div>
            <p className="mt-1 text-sm leading-snug text-gray-600">
              Add a small gift for animal rescue and shelter care. Skip anytime — no pressure.
            </p>
          </div>
        </div>

        {amount > 0 && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-white/90 px-3 py-2 ring-1 ring-rose-100">
            <p className="text-sm font-semibold text-rose-700">
              ${amount.toFixed(2)} added for shelter support
            </p>
            <button
              type="button"
              onClick={() => onChange(0)}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-gray-500 hover:bg-rose-50 hover:text-gray-800"
              aria-label="Remove donation"
            >
              <X size={14} />
              Remove
            </button>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2" role="group" aria-label="Donation amounts">
          {CHECKOUT_CHARITY_PRESETS.map((preset) => {
            const selected = amount === preset && !showCustom;
            return (
              <button
                key={preset}
                type="button"
                aria-pressed={selected}
                aria-label={`Donate $${preset} to animal rescue`}
                onClick={() => selectPreset(preset)}
                className={`rounded-xl px-2 py-2.5 text-sm font-bold transition-all ${
                  selected
                    ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md shadow-rose-200 ring-2 ring-white'
                    : 'bg-white text-gray-800 ring-1 ring-rose-100 hover:bg-rose-50 hover:ring-rose-200'
                }`}
              >
                ${preset}
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
          className={`mt-2 w-full rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
            showCustom
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white/80 text-gray-700 ring-1 ring-rose-100 hover:bg-white'
          }`}
        >
          Other amount
        </button>

        {showCustom && (
          <div className="mt-2">
            <label htmlFor="checkout-charity-custom" className="sr-only">
              Custom donation amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-gray-500">
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
                placeholder="Enter amount"
                onChange={(event) => setCustomValue(event.target.value)}
                onBlur={(event) => applyCustomAmount(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    applyCustomAmount(customValue);
                  }
                }}
                className="w-full rounded-xl border border-rose-200 bg-white py-2.5 pl-7 pr-3 text-sm font-semibold text-gray-900 outline-none ring-rose-200 placeholder:font-normal placeholder:text-gray-400 focus:border-rose-400 focus:ring-2"
              />
            </div>
          </div>
        )}

        <p className="mt-3 text-[11px] leading-relaxed text-gray-500">
          100% of this add-on supports animal shelters and rescue groups. It is added to your order total only if you choose an amount.
        </p>
      </div>
    </section>
  );
};

export default CheckoutCharityCard;
