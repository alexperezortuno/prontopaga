import type { ReactElement } from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { ScorePage } from './pages/ScorePage';

export function App(): ReactElement {
  const { user } = useAuth();
  return user ? <ScorePage /> : <LoginPage />;
}
