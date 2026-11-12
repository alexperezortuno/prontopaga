import type { ReactElement } from 'react';
import { LoginForm } from '../components/LoginForm';

export function LoginPage(): ReactElement {
  return (
    <main className="page-shell login-page">
      <div className="brand-mark">PP</div>
      <LoginForm />
      <p className="page-footnote">Simulación técnica · No constituye una evaluación crediticia real.</p>
    </main>
  );
}
