import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScoreConsultation } from './ScoreConsultation';
import { useAuth } from '../hooks/useAuth';

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }));

const mockedUseAuth = vi.mocked(useAuth);

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('ScoreConsultation RUT field', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      token: 'mock-token',
      user: {
        id: 'admin-1',
        username: 'admin',
        role: 'admin',
      },
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('formats pasted and progressively entered RUT values', () => {
    render(<ScoreConsultation />);
    const input = screen.getByLabelText('RUT a consultar');

    fireEvent.change(input, { target: { value: '123456785' } });
    expect(input).toHaveValue('12.345.678-5');

    fireEvent.change(input, { target: { value: '12 345 678 k' } });
    expect(input).toHaveValue('12.345.678-K');
  });

  it('keeps deletion and selection replacement editable', () => {
    render(<ScoreConsultation />);
    const input = screen.getByLabelText('RUT a consultar');

    fireEvent.change(input, { target: { value: '123456785' } });
    fireEvent.change(input, { target: { value: '12.345.678-' } });
    expect(input).toHaveValue('12.345.678-');

    fireEvent.change(input, { target: { value: '987654321' } });
    expect(input).toHaveValue('98.765.432-1');
  });

  it('does not query the API for an invalid verifier', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<ScoreConsultation />);

    fireEvent.change(screen.getByLabelText('RUT a consultar'), { target: { value: '123456789' } });
    fireEvent.click(screen.getByRole('button', { name: 'Consultar score' }));

    expect(await screen.findByText('Ingresa un RUT válido.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps the existing canonical API contract for valid consultations', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(response({ rut: '12.345.678-5', score: 73, fecha: '2025-06-27T14:35:00.000Z' })),
    );
    render(<ScoreConsultation />);

    fireEvent.change(screen.getByLabelText('RUT a consultar'), { target: { value: '123456785' } });
    fireEvent.click(screen.getByRole('button', { name: 'Consultar score' }));

    await waitFor(() => expect(screen.getByText('73')).toBeInTheDocument());
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/score/12345678-5',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer mock-token' }) }),
    );
  });
});
