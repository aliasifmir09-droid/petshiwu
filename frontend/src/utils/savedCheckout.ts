export type SavedPayRow = {
  _id: string;
  type?: string;
  last4?: string;
  brand?: string;
  isDefault?: boolean;
  expiryMonth?: number | string;
  expiryYear?: number | string;
};

export type SavedAddressRow = {
  _id?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  isDefault?: boolean;
};

export const isReusableSavedCard = (pm?: SavedPayRow | null): boolean =>
  Boolean(pm && String(pm.last4 || '').replace(/\s/g, '').length >= 4);

export const pickDefaultSavedCard = (methods: SavedPayRow[] = []): SavedPayRow | null => {
  const cards = methods.filter(isReusableSavedCard);
  if (!cards.length) return null;
  return cards.find((pm) => pm.isDefault) || cards[0];
};

export const pickDefaultSavedAddress = (addresses: SavedAddressRow[] = []): SavedAddressRow | null => {
  const usable = (addresses || []).filter((addr) => Boolean(addr?.street && addr?.zipCode));
  if (!usable.length) return null;
  return usable.find((addr) => addr.isDefault) || usable[0];
};

export const savedCardLabel = (pm: SavedPayRow): string => {
  const brand = pm.brand
    ? `${pm.brand.charAt(0).toUpperCase()}${pm.brand.slice(1)}`
    : 'Card';
  return `${brand} •••• ${pm.last4}`;
};

export const savedAddressLine = (addr: SavedAddressRow): string =>
  `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}`;

export const formatCardExpiry = (pm: SavedPayRow): string | null => {
  if (!pm.expiryMonth || !pm.expiryYear) return null;
  const month = String(pm.expiryMonth).padStart(2, '0');
  const year = String(pm.expiryYear).slice(-2);
  return `${month}/${year}`;
};
