import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { AuthProvider } from './hooks/useAuth';

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function renderApp(): void {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  );
}

const userLogin = {
  accessToken: 'mock-token',
  user: {
    id: 'user-demo-1',
    username: 'user',
    role: 'user' as const,
    rut: '12345678-5',
  },
};

describe('Financial Risk web app', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the login form', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: 'Financial Risk Score' })).toBeInTheDocument();
    expect(screen.getByLabelText('Usuario')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
  });

  it('logs in successfully and displays a score consultation', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(userLogin, 201))
      .mockResolvedValueOnce(
        response({ rut: '12.345.678-5', score: 73, fecha: '2025-06-27T14:35:00.000Z' }),
      );
    vi.stubGlobal('fetch', fetchMock);
    renderApp();

    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'user' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'user123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByRole('heading', { name: 'Consulta financiera' })).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Consultar score' }));

    expect(await screen.findByText('73')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://localhost:3000/score/12345678-5',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer mock-token' }),
      }),
    );
  });

  it('shows a clear message when login fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({}, 401)));
    renderApp();

    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'user' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByText('No fue posible autenticar la solicitud.')).toBeInTheDocument();
  });

  it('shows a forbidden error for an unauthorized consultation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce(response(userLogin, 201))
        .mockResolvedValueOnce(response({}, 403)),
    );
    renderApp();

    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'user' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'user123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    await screen.findByRole('heading', { name: 'Consulta financiera' });
    fireEvent.click(screen.getByRole('button', { name: 'Consultar score' }));

    expect(await screen.findByText('No tienes permisos para realizar esta operación.')).toBeInTheDocument();
  });

  it('clears an authenticated session after a 401 score response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce(response(userLogin, 201))
        .mockResolvedValueOnce(response({}, 401)),
    );
    renderApp();

    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'user' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'user123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    await screen.findByRole('heading', { name: 'Consulta financiera' });
    fireEvent.click(screen.getByRole('button', { name: 'Consultar score' }));

    expect(await screen.findByText('No fue posible autenticar la solicitud.')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Financial Risk Score' })).toBeInTheDocument();
  });

  it('keeps an authenticated session after a 403 score response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce(response(userLogin, 201))
        .mockResolvedValueOnce(response({}, 403)),
    );
    renderApp();

    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'user' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'user123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    await screen.findByRole('heading', { name: 'Consulta financiera' });
    fireEvent.click(screen.getByRole('button', { name: 'Consultar score' }));

    expect(await screen.findByText('No tienes permisos para realizar esta operación.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Consulta financiera' })).toBeInTheDocument();
  });

  it('logs out and returns to the login form', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(userLogin, 201)));
    renderApp();

    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'user' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'user123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    await screen.findByRole('heading', { name: 'Consulta financiera' });

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Financial Risk Score' })).toBeInTheDocument();
    });
  });
});
