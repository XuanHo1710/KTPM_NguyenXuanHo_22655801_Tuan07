import { api } from './api';

export type Food = {
  _id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const foodService = {
  async getAll(): Promise<Food[]> {
    return api<Food[]>('/foods');
  },

  async getOne(id: string): Promise<Food> {
    return api<Food>(`/foods/${id}`);
  },

  async create(data: Partial<Food>): Promise<Food> {
    return api<Food>('/foods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<Food>): Promise<Food> {
    return api<Food>(`/foods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async remove(id: string): Promise<void> {
    return api<void>(`/foods/${id}`, { method: 'DELETE' });
  },
};
