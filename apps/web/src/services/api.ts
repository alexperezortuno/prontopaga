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

export function getErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'La solicitud no es válida.';
    case 401:
      return 'No fue posible autenticar la solicitud.';
    case 403:
      return 'No tienes permisos para realizar esta operación.';
    case 404:
      return 'El recurso solicitado no está disponible.';
    case 408:
      return 'La solicitud tardó demasiado. Inténtalo nuevamente.';
    case 429:
      return 'Demasiadas solicitudes. Inténtalo más tarde.';
    case 500:
      return 'Ocurrió un problema. Inténtalo más tarde.';
    case 502:
    case 503:
      return 'El servicio no está disponible temporalmente.';
    default:
      return 'No fue posible completar la operación.';
  }
}

async function request<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(0, getErrorMessage(0));
  }

  if (!response.ok) {
    throw new ApiError(response.status, getErrorMessage(response.status));
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
