import type { LoginInput, LoginResponse } from '../types/auth';
import type { ScoreResult } from '../types/score';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!response.ok) {
    let message = 'No fue posible completar la solicitud';
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (typeof body.message === 'string') message = body.message;
      if (Array.isArray(body.message)) message = body.message.join('. ');
    } catch {
      // Keep a safe generic message when the API does not return JSON.
    }
    throw new ApiError(response.status, message);
  }

  return (await response.json()) as T;
}

export function login(input: LoginInput): Promise<LoginResponse> {
  return request<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getScore(token: string, rut: string): Promise<ScoreResult> {
  return request<ScoreResult>(`/score/${encodeURIComponent(rut)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
