import { Check } from 'lucide-react';
import { ProductVariant } from '@/types';
import {
  bestValueOption,
  collectVariantAttrs,
  findVariantIndex,
  formatOptionLabel,
  getVariantDimensions,
  pricePerLb,
  type VariantDimension,
} from '@/utils/productVariants';
import { decodeHtmlEntities } from '@/utils/htmlUtils';

interface ProductVariantPickerProps {
  variants: ProductVariant[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const selectedAttrsForPicker = (
  variants: ProductVariant[],
  selectedIndex: number,
  dimensions: VariantDimension[]
): Record<string, string> => {
  const attrs = collectVariantAttrs(variants[selectedIndex] || variants[0]);
  const allowed = new Set(dimensions.map((dimension) => dimension.key));
  return Object.fromEntries(Object.entries(attrs).filter(([key]) => allowed.has(key)));
};

const ProductVariantPicker = ({
  variants,
  selectedIndex,
  onSelect,
}: ProductVariantPickerProps) => {
  if (!variants?.length) return null;

  const dimensions = getVariantDimensions(variants);
  if (dimensions.length === 0) return null;

  const selected = selectedAttrsForPicker(variants, selectedIndex, dimensions);

  const handleSelect = (key: string, value: string) => {
    const next = { ...selected, [key]: value };
    onSelect(findVariantIndex(variants, next));
  };

  return (
    <div className="mb-6 space-y-5">
      {dimensions.map((dimension) => {
        const selectedValue = selected[dimension.key] || '';
        const isSize = dimension.kind === 'size';
        const bestValue = bestValueOption(variants, dimension, selected);

        return (
          <fieldset key={dimension.key} className="min-w-0">
            <legend className="mb-3 w-full">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  {dimension.label}
                  {selectedValue ? (
                    <span className="font-normal text-gray-500">
                      {' · '}
                      {decodeHtmlEntities(formatOptionLabel(selectedValue, dimension.kind))}
                    </span>
                  ) : null}
                </span>
                {isSize && dimension.values.length > 1 && (
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {dimension.values.length} options
                  </span>
                )}
              </div>
            </legend>

            <div
              className={
                isSize
                  ? 'grid grid-cols-2 sm:grid-cols-3 gap-2.5'
                  : 'flex flex-wrap gap-2'
              }
            >
              {dimension.values.map((value) => {
                const index = findVariantIndex(variants, { ...selected, [dimension.key]: value });
                const variant = variants[index];
                const inStock = (variant?.stock ?? 0) > 0;
                const isSelected = selectedValue === value;
                const price = variant?.price ?? null;
                const unitPrice = isSize ? pricePerLb(price, value) : null;
                const showBest = bestValue === value && inStock && dimension.values.length > 1;
                const label = decodeHtmlEntities(formatOptionLabel(value, dimension.kind));

                if (!isSize) {
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleSelect(dimension.key, value)}
                      disabled={!inStock}
                      aria-pressed={isSelected}
                      className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition-all ${
                        isSelected
                          ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white shadow-sm'
                          : !inStock
                          ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 line-through'
                          : 'border-gray-200 bg-white text-gray-800 hover:border-[#1E3A8A]/50 hover:bg-blue-50'
                      }`}
                    >
                      {label}
                    </button>
                  );
                }

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleSelect(dimension.key, value)}
                    disabled={!inStock}
                    aria-pressed={isSelected}
                    aria-label={`${label}${price != null && price > 0 ? `, $${price.toFixed(2)}` : ''}${!inStock ? ', out of stock' : ''}${isSelected ? ', selected' : ''}`}
                    className={`relative flex min-h-[92px] flex-col items-start rounded-2xl border-2 p-3 text-left transition-all ${
                      isSelected
                        ? 'border-[#1E3A8A] bg-[#EEF2FF] shadow-[0_0_0_3px_rgba(30,58,138,0.12)]'
                        : !inStock
                        ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                        : 'border-gray-200 bg-white hover:border-[#1E3A8A]/40 hover:shadow-sm'
                    }`}
                  >
                    {showBest && (
                      <span className="absolute -top-2 right-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Best value
                      </span>
                    )}
                    <span className="flex w-full items-start justify-between gap-2">
                      <span className={`text-[15px] font-bold leading-tight ${isSelected ? 'text-[#1E3A8A]' : 'text-gray-900'}`}>
                        {label}
                      </span>
                      {isSelected && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] text-white">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </span>
                    {price != null && price > 0 ? (
                      <span className="mt-auto pt-2">
                        <span className="block text-base font-bold text-gray-900">${price.toFixed(2)}</span>
                        {unitPrice != null && (
                          <span className="block text-xs text-gray-500">${unitPrice.toFixed(2)}/lb</span>
                        )}
                      </span>
                    ) : (
                      <span className="mt-auto pt-2 text-xs text-gray-400">See price</span>
                    )}
                    {!inStock && (
                      <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-red-500">
                        Out of stock
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
};

export default ProductVariantPicker;
