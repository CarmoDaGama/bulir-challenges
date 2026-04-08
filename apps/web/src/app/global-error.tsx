'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-mesh flex min-h-screen items-center justify-center px-4">
        <section className="panel w-full max-w-lg p-6 text-slate-100">
          <h1 className="text-2xl">Algo deu errado</h1>
          <p className="mt-2 text-sm text-slate-300">{error.message || 'Falha inesperada na aplicacao web.'}</p>
          <button type="button" className="btn btn-primary mt-5" onClick={() => reset()}>
            Tentar novamente
          </button>
        </section>
      </body>
    </html>
  );
}
