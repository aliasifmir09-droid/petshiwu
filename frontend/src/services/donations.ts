import api from './api';

export interface CreateDonationIntentData {
  amount: number;
  paymentMethod: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay';
  email: string;
  firstName: string;
  lastName: string;
}

export interface DonationIntentResponse {
  success: boolean;
  data: {
    clientSecret: string;
    donationId: string;
    donationNumber: string;
  };
}

export interface ConfirmDonationData {
  donationId?: string;
  paymentIntentId?: string;
}

export const donationService = {
  createDonationIntent: async (data: CreateDonationIntentData): Promise<DonationIntentResponse> => {
    const response = await api.post('/donations/create-intent', data);
    return response.data;
  },

  confirmDonation: async (data: ConfirmDonationData) => {
    const response = await api.post('/donations/confirm', data);
    return response.data;
  },

  getDonation: async (id: string) => {
    const response = await api.get(`/donations/${id}`);
    return response.data;
  }
};

