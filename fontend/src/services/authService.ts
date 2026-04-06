import { api, ApiError } from './api';

export { ApiError };

export type PublicUser = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
};

export type RegisterResponse = { message: string; user: PublicUser };
export type LoginResponse = { message: string; accessToken: string; user: PublicUser };

export const authService = {
  async register(payload: { name: string; email: string; password: string }) {
    return api<RegisterResponse>('/users/register', {
      method: 'POST',
      body: JSON.stringify({
        username: payload.name,
        email: payload.email,
        password: payload.password,
      }),
    });
  },

  async login(payload: { email: string; password: string }) {
    return api<LoginResponse>('/users/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: payload.email,
        password: payload.password,
      }),
    });
  },

  async getUsers() {
    return api<{ users: PublicUser[] }>('/users');
  },
};

export type { PublicUser as AuthPublicUser };
export type AuthApiError = ApiError;
