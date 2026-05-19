import api from './api';
import { Pet } from '@/types';

interface ApiResponse<T> { success: boolean; data: T; message?: string; }

export const petService = {
  getMyPets: async (): Promise<Pet[]> => {
    const res = await api.get<ApiResponse<Pet[]>>('/users/me/pets');
    return res.data.data;
  },

  addPet: async (pet: Omit<Pet, '_id'>): Promise<Pet> => {
    const res = await api.post<ApiResponse<Pet>>('/users/me/pets', pet);
    return res.data.data;
  },

  updatePet: async (petId: string, pet: Partial<Pet>): Promise<Pet> => {
    const res = await api.put<ApiResponse<Pet>>(`/users/me/pets/${petId}`, pet);
    return res.data.data;
  },

  deletePet: async (petId: string): Promise<void> => {
    await api.delete(`/users/me/pets/${petId}`);
  },
};
