import api from './api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface Address {
  _id: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

export const addressService = {
  getAddresses: async (): Promise<Address[]> => {
    const response = await api.get<ApiResponse<Address[]>>('/users/addresses');
    return response.data.data;
  },

  createAddress: async (address: Omit<Address, '_id'>): Promise<Address> => {
    const response = await api.post<ApiResponse<Address>>('/users/addresses', address);
    return response.data.data;
  },

  updateAddress: async (addressId: string, address: Partial<Address>): Promise<Address> => {
    const response = await api.put<ApiResponse<Address>>(`/users/addresses/${addressId}`, address);
    return response.data.data;
  },

  deleteAddress: async (addressId: string): Promise<void> => {
    await api.delete(`/users/addresses/${addressId}`);
  }
};

