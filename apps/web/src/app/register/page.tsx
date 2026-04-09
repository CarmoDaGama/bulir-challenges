'use client';

import { RegisterInputSchema, UserRole } from '@bulir-challenges/api-contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';
import { useAuth } from '../../components/auth-provider';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { getErrorMessage } from '../../lib/errors';
import { cn } from '../../lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const { register, status } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nif, setNif] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CLIENT');
  const [balance, setBalance] = useState('100.00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDarkMode = false;

  const showBalanceField = useMemo(() => role === 'CLIENT', [role]);

  if (status === 'authenticated') {
    router.replace('/services');
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const payload = {
      name: name.trim(),
      email: email.trim(),
      nif: nif.trim(),
      password,
      role,
      balance: showBalanceField ? balance.trim() : undefined,
    };

    const parsed = RegisterInputSchema.safeParse(payload);
    if (!parsed.success) {
      setError('Preencha os campos corretamente: nome, email, NIF com 9 dígitos e senha de 8+ caracteres.');
      return;
    }

    setLoading(true);

    try {
      await register(parsed.data);
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
          'relative w-full max-w-lg overflow-hidden border-0 p-0 shadow-[0_25px_55px_-40px_rgba(15,23,42,0.65)]',
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
            <h1 className="text-3xl font-semibold text-zinc-900">Criar conta</h1>
            <p className="mt-2 text-sm text-zinc-600">Cadastre-se como CLIENT ou PROVIDER e acesse o painel web.</p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Nome</span>
              <input
                className="h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-slate-500"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Email</span>
              <input
                className="h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-slate-500"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">NIF (9 dígitos)</span>
              <input
                className="h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-slate-500"
                value={nif}
                maxLength={9}
                onChange={(event) => setNif(event.target.value.replace(/\D/g, '').slice(0, 9))}
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Senha</span>
              <input
                className="h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-slate-500"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Perfil</span>
              <select
                className="h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-slate-500"
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
              >
                <option value="CLIENT">CLIENT</option>
                <option value="PROVIDER">PROVIDER</option>
              </select>
            </label>

            {showBalanceField ? (
              <label className="block space-y-2 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Saldo inicial (opcional)</span>
                <input
                  className="h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-slate-500"
                  value={balance}
                  onChange={(event) => setBalance(event.target.value)}
                  placeholder="100.00"
                />
              </label>
            ) : null}

            {error ? <p className="rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 sm:col-span-2">{error}</p> : null}

            <Button type="submit" disabled={loading} className="w-full sm:col-span-2">
              {loading ? 'Criando conta...' : 'Cadastrar'}
            </Button>

            <p className="text-center text-sm text-zinc-600 sm:col-span-2">
              Já possui conta?{' '}
              <Link href="/login" className="font-medium text-slate-700 hover:text-slate-900">
                Entrar
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
