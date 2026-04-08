'use client';

import { LoginInputSchema } from '@bulir-challenges/api-contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useAuth } from '../../components/auth-provider';
import { getErrorMessage } from '../../lib/errors';

export default function LoginPage() {
  const router = useRouter();
  const { login, status } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === 'authenticated') {
    router.replace('/services');
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = LoginInputSchema.safeParse({ identifier, password });
    if (!parsed.success) {
      setError('Informe email ou NIF valido e senha com pelo menos 8 caracteres.');
      return;
    }

    setLoading(true);

    try {
      await login(parsed.data);
      router.replace('/services');
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="panel w-full max-w-md p-6 sm:p-8">
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-cyan-300/80">Bulir Challenges</p>
        <h1 className="text-3xl">Acesso Web</h1>
        <p className="mt-2 text-sm text-slate-300">Entre com email ou NIF para acessar seu painel.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block space-y-2">
            <span className="label">Email ou NIF</span>
            <input
              className="input"
              placeholder="exemplo@site.com ou 123456789"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
            />
          </label>

          <label className="block space-y-2">
            <span className="label">Senha</span>
            <input
              className="input"
              type="password"
              placeholder="********"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? <p className="rounded-xl bg-rose-400/20 px-3 py-2 text-sm text-rose-100">{error}</p> : null}

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="text-center text-sm text-slate-300">
            Nao possui conta?{' '}
            <Link href="/register" className="text-cyan-200 hover:text-cyan-100">
              Criar conta
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
