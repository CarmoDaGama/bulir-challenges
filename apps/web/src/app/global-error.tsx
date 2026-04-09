'use client';

import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-100 px-4">
        <div className="pointer-events-none absolute -left-16 top-14 h-56 w-56 rounded-full bg-slate-300/55 blur-3xl" />
        <div className="pointer-events-none absolute bottom-4 right-8 h-36 w-36 rounded-full bg-sky-200/60 blur-3xl" />

        <Card className="relative w-full max-w-lg overflow-hidden border-0 bg-gradient-to-br from-white via-zinc-50 to-slate-100 p-0 text-zinc-900 shadow-[0_25px_55px_-40px_rgba(15,23,42,0.65)]">
          <div className="pointer-events-none absolute -left-10 top-10 h-40 w-40 rounded-full bg-slate-300/55 blur-3xl" />
          <div className="pointer-events-none absolute bottom-6 right-6 h-24 w-24 rounded-full bg-sky-200/55 blur-2xl" />

          <CardContent className="relative p-6 sm:p-8">
            <h1 className="text-2xl font-semibold">Algo deu errado</h1>
            <p className="mt-2 text-sm text-zinc-600">{error.message || 'Falha inesperada na aplicação web.'}</p>
            <Button type="button" className="mt-5" onClick={() => reset()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </body>
    </html>
  );
}
