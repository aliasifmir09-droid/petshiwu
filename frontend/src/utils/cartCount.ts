/** Safe cart badge count. Persist/rehydrate can briefly leave items missing. */
export const cartItemCount = (items: unknown): number => {
  if (!Array.isArray(items)) return 0;
  return items.reduce((total: number, item: { quantity?: unknown }) => {
    return total + (Number(item?.quantity) || 0);
  }, 0);
};
