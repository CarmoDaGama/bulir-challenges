'use client';

import { LoginInputSchema } from '@bulir-challenges/api-contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useAuth } from '../../components/auth-provider';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { cn } from '../../lib/utils';
import { getErrorMessage } from '../../lib/errors';

export default function LoginPage() {
  const router = useRouter();
  const { login, status } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDarkMode = false;

  if (status === 'authenticated') {
    router.replace('/services');
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = LoginInputSchema.safeParse({ identifier, password });
    if (!parsed.success) {
      setError('Informe email ou NIF válido e senha com pelo menos 8 caracteres.');
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-100 px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute -left-16 top-14 h-56 w-56 rounded-full bg-slate-300/55 blur-3xl" />
      <div className="pointer-events-none absolute bottom-4 right-8 h-36 w-36 rounded-full bg-sky-200/60 blur-3xl" />

      <Card
        className={cn(
          'relative w-full max-w-md overflow-hidden border-0 p-0 shadow-[0_25px_55px_-40px_rgba(15,23,42,0.65)]',
          isDarkMode
            ? 'bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900'
            : 'bg-gradient-to-br from-white via-zinc-50 to-slate-100'
        )}
      >
        <div className="pointer-events-none absolute -left-10 top-10 h-40 w-40 rounded-full bg-slate-300/55 blur-3xl" />
        <div className="pointer-events-none absolute bottom-6 right-6 h-24 w-24 rounded-full bg-sky-200/55 blur-2xl" />

        <CardContent className="relative space-y-5 p-6 sm:p-8">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">Bulir Challenges</p>
            <h1 className="text-3xl font-semibold text-zinc-900">Acesso Web</h1>
            <p className="mt-2 text-sm text-zinc-600">Entre com email ou NIF para acessar seu painel.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Email ou NIF</span>
              <input
                className="h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-slate-500"
                placeholder="exemplo@site.com ou 123456789"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Senha</span>
              <input
                className="h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-slate-500"
                type="password"
                placeholder="********"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {error ? <p className="rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <p className="text-center text-sm text-zinc-600">
              Não possui conta?{' '}
              <Link href="/register" className="font-medium text-slate-700 hover:text-slate-900">
                Criar conta
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
