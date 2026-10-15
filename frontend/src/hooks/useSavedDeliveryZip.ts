import { useEffect, useState } from 'react';
import { LAST_ZIP_EVENT, LAST_ZIP_STORAGE_KEY } from '@/utils/deliveryZip';

const readZip = (): string => {
  try {
    const saved = localStorage.getItem(LAST_ZIP_STORAGE_KEY);
    return saved && /^\d{5}$/.test(saved) ? saved : '';
  } catch {
    return '';
  }
};

export function useSavedDeliveryZip(): string {
  const [zip, setZip] = useState(readZip);

  useEffect(() => {
    const onZip = (event: Event) => setZip(String((event as CustomEvent<string>).detail || ''));
    window.addEventListener(LAST_ZIP_EVENT, onZip);
    return () => window.removeEventListener(LAST_ZIP_EVENT, onZip);
  }, []);

  return zip;
}
