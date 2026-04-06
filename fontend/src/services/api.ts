const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://192.168.137.49:3006/api/v1';
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = { message: text }; }
  }

  if (!res.ok) {
    const msg = (data as any)?.message;
    const message = Array.isArray(msg) ? msg.join(', ') : (typeof msg === 'string' ? msg : 'Yêu cầu thất bại');
    throw new ApiError(message, res.status);
  }

  // Handle gateway envelope
  if (data && typeof data === 'object' && 'statusCode' in data && 'data' in data) {
    return (data as any).data as T;
  }

  return data as T;
}
