import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import { ApiError, getErrorMessage, login as loginRequest } from '../services/api';
import type { LoginInput, SessionUser } from '../types/auth';

interface AuthContextValue {
  readonly token: string | null;
  readonly user: SessionUser | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly login: (input: LoginInput) => Promise<boolean>;
  readonly logout: (message?: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren): ReactElement {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(input: LoginInput): Promise<boolean> {
    setIsLoading(true);
    setError(null);

    try {
      const response = await loginRequest(input);
      setToken(response.accessToken);
      setUser(response.user);
      return true;
    } catch (reason) {
      setToken(null);
      setUser(null);
      setError(reason instanceof ApiError ? reason.message : getErrorMessage(0));
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  function logout(message?: string): void {
    setToken(null);
    setUser(null);
    setError(message ?? null);
  }

  const value = useMemo(
    () => ({ token, user, isLoading, error, login, logout }),
    [token, user, isLoading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
