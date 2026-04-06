import { api } from './api';

export type OrderItem = {
  foodId: string;
  foodName: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export type Order = {
  _id: string;
  userId: number;
  userName: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt?: string;
};

export const orderService = {
  async getAll(): Promise<Order[]> {
    return api<Order[]>('/orders');
  },

  async create(data: { userId: number; items: { foodId: string; quantity: number }[] }): Promise<Order> {
    return api<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
