'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { useAuth } from './auth-provider';

export function ProtectedLayoutShell({ children }: { children: React.ReactNode }) {
  const { status, user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const links = useMemo(
    () => [
      { href: '/services', label: user?.role === 'PROVIDER' ? 'Meus serviços' : 'Catálogo de serviços' },
      { href: '/transactions', label: 'Histórico de transações' },
    ],
    [user?.role]
  );

  if (status === 'loading') {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-100 px-5 py-8">
        <div className="pointer-events-none absolute -left-16 top-14 h-56 w-56 rounded-full bg-slate-300/55 blur-3xl" />
        <div className="pointer-events-none absolute bottom-4 right-8 h-36 w-36 rounded-full bg-sky-200/60 blur-3xl" />

        <div className="relative w-full max-w-xl rounded-3xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-slate-100 p-8 text-center shadow-[0_24px_50px_-35px_rgba(15,23,42,0.5)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">Bulir Challenges</p>
          <h2 className="mt-3 text-3xl font-semibold text-zinc-900">Carregando sessão</h2>
          <p className="mt-2 text-sm text-zinc-600">Preparando o seu painel com o tema do marketplace.</p>
        </div>
      </main>
    );
  }

  if (status === 'unauthenticated' || !user) {
    router.replace('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="sticky top-1 z-30 mx-auto w-full max-w-6xl px-5 py-2">
        <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/85 px-4 py-4 backdrop-blur-xl shadow-[0_20px_45px_-30px_rgba(15,23,42,0.45)] sm:px-6">
          <div className="pointer-events-none absolute -top-20 right-0 h-48 w-48 rounded-full bg-slate-300/45 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-20 h-24 w-24 rounded-full bg-sky-200/45 blur-2xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-600">Bulir Challenges</p>
              <h1 className="text-2xl font-semibold">Painel Web</h1>
              <p className="text-sm text-zinc-600">
                {user.name} ({user.role}) • Saldo AOA {user.balance}
              </p>
            </div>

            <nav className="flex flex-wrap gap-2">
              {links.map((link) => (
                <motion.div whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }} key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      'inline-flex rounded-full border px-4 py-2 text-sm transition-all duration-200',
                      pathname === link.href
                        ? 'border-slate-400 bg-slate-100 text-slate-800'
                        : 'border-zinc-300 bg-white text-zinc-700 hover:border-slate-400 hover:bg-slate-100'
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  logout();
                  router.replace('/login');
                }}
              >
                Sair
              </Button>
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-5 pb-8">{children}</main>
    </div>
  );
}
