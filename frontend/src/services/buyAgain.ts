import api from './api';
import type { RestockMode, RestockPick } from '@/utils/restock';

export type BuyAgainItem = {
  product?: unknown;
  name?: string;
  image?: string;
  price?: number;
  quantity?: number;
  variant?: { sku?: string };
  restockable?: boolean;
};

export type BuyAgainLastOrder = {
  _id: string;
  orderNumber: string;
  orderStatus?: string;
  createdAt: string;
  totalPrice: number;
  items: BuyAgainItem[];
};

export type BuyAgainRegular = {
  productId: string;
  sku?: string;
  name: string;
  image: string;
  lastPrice: number;
  lastQuantity: number;
  timesOrdered: number;
  lastOrderedAt: string;
  restockable?: boolean;
};

export type BuyAgainReminder = {
  _id: string;
  orderId: string;
  orderNumber: string;
  weeks: number;
  mode: RestockMode;
  remindAt: string;
  status: string;
  items?: RestockPick[];
};

export type BuyAgainPayload = {
  lastOrder: BuyAgainLastOrder | null;
  usual: RestockPick[];
  regulars: BuyAgainRegular[];
  reminder: BuyAgainReminder | null;
};

export const buyAgainService = {
  getBuyAgain: async (): Promise<BuyAgainPayload> => {
    const response = await api.get<{ success: boolean; data: BuyAgainPayload }>('/orders/buy-again');
    return response.data.data;
  },

  createReminder: async (
    orderId: string,
    weeks: number,
    mode: RestockMode,
    items: RestockPick[]
  ): Promise<BuyAgainReminder> => {
    const response = await api.post(`/orders/${encodeURIComponent(orderId)}/reminder`, {
      weeks,
      mode,
      items,
    });
    return response.data.data;
  },

  cancelReminder: async (reminderId: string): Promise<void> => {
    await api.delete(`/orders/reminders/${encodeURIComponent(reminderId)}`);
  },
};
