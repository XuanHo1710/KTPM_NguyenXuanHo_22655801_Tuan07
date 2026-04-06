import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type HeaderMap = Record<string, string>;

@Injectable()
export class UserServiceProxy {
  constructor(private readonly configService: ConfigService) {}

  async post<TResponse>(
    path: string,
    body: unknown,
    headers: HeaderMap = {},
  ): Promise<TResponse> {
    return this.request<TResponse>(path, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    });
  }

  async get<TResponse>(
    path: string,
    headers: HeaderMap = {},
  ): Promise<TResponse> {
    return this.request<TResponse>(path, {
      method: 'GET',
      headers,
    });
  }

  private async request<TResponse>(
    path: string,
    init: RequestInit,
  ): Promise<TResponse> {
    const endpoint = `${this.getUserServiceUrl()}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.getTimeoutMs());

    try {
      const response = await fetch(endpoint, {
        ...init,
        signal: controller.signal,
      });

      const payload = await this.readPayload(response);

      if (!response.ok) {
        const message =
          this.extractMessage(payload) ??
          `User service error: HTTP ${response.status}`;
        throw new HttpException(message, response.status);
      }

      return payload as TResponse;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new GatewayTimeoutException('User service timeout');
      }

      throw new BadGatewayException('Cannot connect to user service');
    } finally {
      clearTimeout(timeout);
    }
  }

  private getUserServiceUrl(): string {
    return (
      this.configService
        .get<string>('USER_SERVICE_URL')
        ?.trim()
        .replace(/\/+$/, '') ?? 'http://localhost:3001'
    );
  }

  private getTimeoutMs(): number {
    const value = Number(this.configService.get<string>('UPSTREAM_TIMEOUT_MS'));

    if (Number.isFinite(value) && value > 0) {
      return value;
    }

    return 10000;
  }

  private async readPayload(response: globalThis.Response): Promise<unknown> {
    const text = await response.text();

    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { message: text };
    }
  }

  private extractMessage(payload: unknown): string | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const message = (payload as { message?: unknown }).message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (typeof message === 'string') {
      return message;
    }

    return null;
  }
}
