type ApiEnvelope<TData> = {
  statusCode: number;
  message?: string | string[];
  data: TData;
  error?: string | null;
};

type PublicUser = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
};

export type RegisterResponse = {
  message: string;
  user: PublicUser;
};

export type LoginResponse = {
  message: string;
  accessToken: string;
  user: PublicUser;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3002/api/v1';

function isApiEnvelope<TData>(payload: unknown): payload is ApiEnvelope<TData> {
  return (
    payload !== null &&
    typeof payload === 'object' &&
    'statusCode' in payload &&
    'data' in payload
  );
}

function readMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return 'Lỗi không xác định';
  }

  const message = (payload as { message?: unknown }).message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return 'Yêu cầu thất bại';
}

async function request<TData>(
  path: string,
  init: RequestInit,
): Promise<TData> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    throw new AuthApiError(readMessage(payload), response.status);
  }

  if (isApiEnvelope<TData>(payload)) {
    return payload.data;
  }

  return payload as TData;
}

export const authService = {
  login(payload: LoginPayload) {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
      }),
    });
  },

  register(payload: RegisterPayload) {
    return request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        password: payload.password,
      }),
    });
  },
};
