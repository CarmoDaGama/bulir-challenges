import type { AuthResponse, AuthUser, LoginInput, RegisterInput } from '@bulir-challenges/api-contracts';
import { AuthResponseSchema } from '@bulir-challenges/api-contracts';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../lib/api';
import { ApiError } from '../lib/http';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface SessionState {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  withAuth: <T>(action: (token: string) => Promise<T>) => Promise<T>;
}

const SESSION_STORAGE_KEY = 'bulir.mobile.session';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function saveSession(session: SessionState | null) {
  try {
    if (!session) {
      await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
      return;
    }

    await SecureStore.setItemAsync(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.warn('Failed to persist session in SecureStore', error);
  }
}

async function readSession(): Promise<SessionState | null> {
  let raw: string | null = null;

  try {
    raw = await SecureStore.getItemAsync(SESSION_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to read session from SecureStore', error);
    return null;
  }

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    // Validate the stored data using Zod schema to ensure data integrity
    const validatedResponse = AuthResponseSchema.parse(parsed);
    return {
      accessToken: validatedResponse.accessToken,
      refreshToken: validatedResponse.refreshToken,
      user: validatedResponse.user,
    };
  } catch (e) {
    console.warn('Failed to parse or validate stored session', e);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<SessionState | null>(null);

  const applyAuthResponse = useCallback((payload: AuthResponse) => {
    const nextSession: SessionState = {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      user: payload.user,
    };

    setSession(nextSession);
    setStatus('authenticated');
    void saveSession(nextSession);
  }, []);

  const logout = useCallback(async () => {
    setSession(null);
    setStatus('unauthenticated');
    await saveSession(null);
  }, []);

  const refreshByToken = useCallback(
    async (refreshToken: string) => {
      const refreshed = await api.refresh(refreshToken);
      applyAuthResponse(refreshed);
      return refreshed.accessToken;
    },
    [applyAuthResponse]
  );

  const login = useCallback(
    async (input: LoginInput) => {
      const auth = await api.login(input);
      applyAuthResponse(auth);
    },
    [applyAuthResponse]
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const auth = await api.register(input);
      applyAuthResponse(auth);
    },
    [applyAuthResponse]
  );

  const refreshUser = useCallback(async () => {
    if (!session?.accessToken) return;
    const user = await api.getMe(session.accessToken);
    const nextSession = { ...session, user };
    setSession(nextSession);
    await saveSession(nextSession);
  }, [session]);

  const withAuth = useCallback(
    async <T,>(action: (token: string) => Promise<T>): Promise<T> => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      try {
        return await action(session.accessToken);
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 401) {
          try {
            const newAccessToken = await refreshByToken(session.refreshToken);
            return await action(newAccessToken);
          } catch {
            await logout();
          }
        }

        throw error;
      }
    },
    [logout, refreshByToken, session]
  );

  useEffect(() => {
    const bootstrap = async () => {
      const stored = await readSession();
      if (!stored) {
        setStatus('unauthenticated');
        return;
      }

      setSession(stored);

      try {
        const user = await api.getMe(stored.accessToken);
        const hydrated = { ...stored, user };
        setSession(hydrated);
        await saveSession(hydrated);
        setStatus('authenticated');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 401) {
          try {
            const refreshed = await api.refresh(stored.refreshToken);
            applyAuthResponse(refreshed);
          } catch {
            await logout();
          }
          return;
        }

        await logout();
      }
    };

    void bootstrap();
  }, [applyAuthResponse, logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      login,
      register,
      logout,
      refreshUser,
      withAuth,
    }),
    [login, logout, refreshUser, register, session?.accessToken, session?.user, status, withAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
