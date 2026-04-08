'use client';

import { RegisterInputSchema, UserRole } from '@bulir-challenges/api-contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';
import { useAuth } from '../../components/auth-provider';
import { getErrorMessage } from '../../lib/errors';

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
      setError('Preencha os campos corretamente: nome, email, NIF com 9 digitos e senha de 8+ caracteres.');
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
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="panel w-full max-w-lg p-6 sm:p-8">
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-cyan-300/80">Bulir Challenges</p>
        <h1 className="text-3xl">Criar conta</h1>
        <p className="mt-2 text-sm text-slate-300">Cadastre-se como CLIENT ou PROVIDER e acesse o painel web.</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2 sm:col-span-2">
            <span className="label">Nome</span>
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} required />
          </label>

          <label className="block space-y-2">
            <span className="label">Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="label">NIF (9 digitos)</span>
            <input
              className="input"
              value={nif}
              maxLength={9}
              onChange={(event) => setNif(event.target.value.replace(/\D/g, '').slice(0, 9))}
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="label">Senha</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="label">Perfil</span>
            <select
              className="select"
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
            >
              <option value="CLIENT">CLIENT</option>
              <option value="PROVIDER">PROVIDER</option>
            </select>
          </label>

          {showBalanceField ? (
            <label className="block space-y-2 sm:col-span-2">
              <span className="label">Saldo inicial (opcional)</span>
              <input
                className="input"
                value={balance}
                onChange={(event) => setBalance(event.target.value)}
                placeholder="100.00"
              />
            </label>
          ) : null}

          {error ? (
            <p className="rounded-xl bg-rose-400/20 px-3 py-2 text-sm text-rose-100 sm:col-span-2">{error}</p>
          ) : null}

          <button type="submit" disabled={loading} className="btn btn-primary sm:col-span-2">
            {loading ? 'Criando conta...' : 'Cadastrar'}
          </button>

          <p className="text-center text-sm text-slate-300 sm:col-span-2">
            Ja possui conta?{' '}
            <Link href="/login" className="text-cyan-200 hover:text-cyan-100">
              Entrar
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
