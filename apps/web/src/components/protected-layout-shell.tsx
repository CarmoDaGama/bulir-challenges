'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useAuth } from './auth-provider';

export function ProtectedLayoutShell({ children }: { children: React.ReactNode }) {
  const { status, user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const links = useMemo(
    () => [
      { href: '/services', label: user?.role === 'PROVIDER' ? 'Meus servicos' : 'Catalogo de servicos' },
      { href: '/transactions', label: 'Historico de transacoes' },
    ],
    [user?.role]
  );

  if (status === 'loading') {
    return <main className="min-h-screen p-8 text-slate-100">Carregando sessao...</main>;
  }

  if (status === 'unauthenticated' || !user) {
    router.replace('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-mesh text-slate-100">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-cyan-200/80">Bulir Challenges</p>
          <h1 className="text-2xl font-semibold">Painel Web</h1>
          <p className="text-sm text-slate-300">
            {user.name} ({user.role}) • Saldo AOA {user.balance}
          </p>
        </div>
        <div className="flex gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-4 py-2 text-sm transition ${
                pathname === link.href
                  ? 'bg-cyan-300/20 text-cyan-100'
                  : 'bg-slate-900/40 text-slate-200 hover:bg-slate-800/70'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace('/login');
            }}
            className="rounded-full bg-rose-400/20 px-4 py-2 text-sm text-rose-100 hover:bg-rose-400/30"
          >
            Sair
          </button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-5 pb-8">{children}</main>
    </div>
  );
}
