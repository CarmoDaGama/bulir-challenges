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
      { href: '/services', label: user?.role === 'PROVIDER' ? 'Meus servicos' : 'Catalogo de servicos' },
      { href: '/transactions', label: 'Historico de transacoes' },
    ],
    [user?.role]
  );

  if (status === 'loading') {
    return <main className="min-h-screen p-8 text-slate-700">Carregando sessao...</main>;
  }

  if (status === 'unauthenticated' || !user) {
    router.replace('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="sticky top-4 z-30 mx-auto w-full max-w-6xl px-5 py-4">
        <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/85 px-4 py-4 backdrop-blur-xl shadow-[0_20px_45px_-30px_rgba(15,23,42,0.45)] sm:px-6">
          <div className="pointer-events-none absolute -top-20 right-0 h-48 w-48 rounded-full bg-lime-300/45 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-20 h-24 w-24 rounded-full bg-rose-300/35 blur-2xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-600">Bulir Challenges</p>
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
                        ? 'border-emerald-500/45 bg-emerald-50 text-emerald-700'
                        : 'border-zinc-300 bg-white text-zinc-700 hover:border-emerald-500/45 hover:bg-emerald-50'
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
