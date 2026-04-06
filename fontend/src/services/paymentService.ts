import { api } from './api';

export type PaymentResult = {
  success: boolean;
  message: string;
  data?: {
    paymentId: string;
    paymentCode: number;
    orderId: string;
    amount: number;
    status: string;
    checkoutUrl?: string;
    qrCode?: string;
    userName?: string;
    items?: any[];
  };
};

export type VerifyResult = {
  success: boolean;
  message: string;
  status?: string;
  payment?: any;
};

export const paymentService = {
  async create(data: { orderId: string; customerEmail: string; description?: string }): Promise<PaymentResult> {
    return api<PaymentResult>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAll(): Promise<any[]> {
    return api<any[]>('/payments');
  },

  async getByOrder(orderId: string): Promise<any[]> {
    return api<any[]>(`/payments/order/${orderId}`);
  },

  async verify(paymentCode: number): Promise<VerifyResult> {
    return api<VerifyResult>(`/payments/verify/${paymentCode}`);
  },
};
