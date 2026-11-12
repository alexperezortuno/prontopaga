import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  getErrorMessage,
  getScore,
} from './api';

describe('HTTP error handling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    [400, 'La solicitud no es válida.'],
    [401, 'No fue posible autenticar la solicitud.'],
    [403, 'No tienes permisos para realizar esta operación.'],
    [404, 'El recurso solicitado no está disponible.'],
    [500, 'Ocurrió un problema. Inténtalo más tarde.'],
    [418, 'No fue posible completar la operación.'],
  ])('maps HTTP %s to a generic message', (status, message) => {
    expect(getErrorMessage(status)).toBe(message);
  });

  it('does not parse or expose an empty error response body', async () => {
    const json = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json }));

    await expect(getScore('token', '12345678-5')).rejects.toEqual(
      new ApiError(500, 'Ocurrió un problema. Inténtalo más tarde.'),
    );
    expect(json).not.toHaveBeenCalled();
  });

  it('returns a generic error when there is no HTTP response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection refused')));

    await expect(getScore('token', '12345678-5')).rejects.toEqual(
      new ApiError(0, 'No fue posible completar la operación.'),
    );
  });
});
