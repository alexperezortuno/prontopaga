import { useEffect, useState, type ReactElement } from 'react';
import { ApiError, getErrorMessage, getScore } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { ScoreResult } from '../types/score';

export function ScoreConsultation(): ReactElement {
  const { token, user, logout } = useAuth();
  const [rut, setRut] = useState(user?.rut ?? '');
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'user' && user.rut) setRut(user.rut);
  }, [user]);

  async function consult(): Promise<void> {
    if (!token || !rut.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      setResult(await getScore(token, rut.trim()));
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) {
        logout(reason.message);
      } else {
        setError(reason instanceof ApiError ? reason.message : getErrorMessage(0));
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="dashboard-card">
      <div className="dashboard-header">
        <div>
          <div className="eyebrow">SCORE CONSOLE</div>
          <h1>Consulta financiera</h1>
        </div>
        <button className="button ghost" type="button" onClick={() => logout()}>Cerrar sesión</button>
      </div>

      <div className="profile-strip">
        <span className="avatar">{user?.username.slice(0, 1).toUpperCase()}</span>
        <div>
          <strong>{user?.username}</strong>
          <span>{user?.role === 'admin' ? 'Administrador' : 'Usuario'}{user?.rut ? ` · ${user.rut}` : ''}</span>
        </div>
        <span className={`role-tag ${user?.role}`}>{user?.role}</span>
      </div>

      <div className="query-area">
        <label htmlFor="rut">RUT a consultar</label>
        <div className="query-row">
          <input
            id="rut"
            value={rut}
            onChange={(event) => setRut(event.target.value)}
            placeholder="12.345.678-5"
            disabled={user?.role === 'user'}
            aria-describedby="rut-help"
          />
          <button className="button primary" type="button" onClick={consult} disabled={isLoading || !rut.trim()}>
            {isLoading ? 'Consultando…' : 'Consultar score'}
          </button>
        </div>
        <span id="rut-help" className="field-help">
          {user?.role === 'user' ? 'Solo puedes consultar el RUT asociado a tu cuenta.' : 'Admin puede consultar cualquier RUT válido.'}
        </span>
      </div>

      {error && <p className="alert error">{error}</p>}

      {result && (
        <div className="score-result" aria-live="polite">
          <div>
            <span className="result-label">Score de riesgo simulado</span>
            <strong className="score-value">{result.score}<small>/100</small></strong>
          </div>
          <div className="result-meta">
            <span>RUT {result.rut}</span>
            <span>Consultado {new Date(result.fecha).toLocaleString('es-CL')}</span>
          </div>
        </div>
      )}
    </section>
  );
}
