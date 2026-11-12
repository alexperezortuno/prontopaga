import { useState, type FormEvent, type ReactElement } from 'react';
import { useAuth } from '../hooks/useAuth';

export function LoginForm(): ReactElement {
  const { login, isLoading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!username.trim() || !password) return;
    await login({ username: username.trim(), password });
  }

  return (
    <form className="auth-card" onSubmit={submit} noValidate>
      <div className="eyebrow">PRONTOPAGA / RISK LAB</div>
      <h1>Financial Risk Score</h1>
      <p className="muted">Accede a la consola de evaluación de riesgo.</p>

      <label htmlFor="username">Usuario</label>
      <input
        id="username"
        name="username"
        autoComplete="username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        placeholder="Ingresa tu usuario"
        required
      />

      <label htmlFor="password">Contraseña</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Ingresa tu contraseña"
        required
      />

      {error && <p className="alert error">No se pudo iniciar sesión. Verifica tus credenciales.</p>}

      <button className="button primary" type="submit" disabled={isLoading || !username || !password}>
        {isLoading ? 'Validando…' : 'Iniciar sesión'}
      </button>
      <p className="mock-note">Entorno demo · credenciales mock habilitadas</p>
    </form>
  );
}
