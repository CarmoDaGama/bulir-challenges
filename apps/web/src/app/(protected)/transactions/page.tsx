'use client';

import { TransactionStatus, TransactionType } from '@bulir-challenges/api-contracts';
import { Search, Wallet } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { getErrorMessage } from '../../../lib/errors';
import { cn } from '../../../lib/utils';
import * as api from '../../../lib/api';

export default function TransactionsPage() {
  const { withAuth } = useAuth();
  const isDarkMode = false;

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState<TransactionStatus | ''>('');
  const [type, setType] = useState<TransactionType | ''>('');

  const [items, setItems] = useState<Awaited<ReturnType<typeof api.listTransactions>>['items']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await withAuth((token) =>
        api.listTransactions(token, {
          page,
          pageSize,
          from: from || undefined,
          to: to || undefined,
          status: status || undefined,
          type: type || undefined,
        })
      );

      setItems(data.items);
      setTotalPages(data.meta.totalPages);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTransactions();
  }, [page, pageSize]);

  const onFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    void loadTransactions();
  };

  return (
    <section
      className={cn(
        'space-y-6 pb-8 transition-colors duration-300',
        isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
      )}
    >
      <Card
        className={cn(
          'relative overflow-hidden border-0 p-0 shadow-none',
          isDarkMode
            ? 'bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900'
            : 'bg-gradient-to-br from-white via-zinc-50 to-slate-100'
        )}
      >
        <div className="pointer-events-none absolute -left-10 top-10 h-48 w-48 rounded-full bg-slate-300/55 blur-3xl" />
        <div className="pointer-events-none absolute bottom-6 right-8 h-24 w-24 rounded-full bg-sky-200/55 blur-2xl" />

        <CardContent className="relative space-y-5 p-6 md:p-9">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-300/60 bg-slate-200/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
            <Wallet size={14} />
            Financeiro
          </div>

          <div className="space-y-2">
            <h2 className="text-4xl font-semibold leading-tight text-zinc-900 md:text-5xl">Histórico de transações</h2>
            <p className="text-sm text-zinc-600 md:text-base">Filtros por período, status e tipo com paginação inteligente.</p>
          </div>

          <form onSubmit={onFilterSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">De</span>
              <input
                className="h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-slate-500"
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Até</span>
              <input
                className="h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-slate-500"
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Status</span>
              <select
                className="h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-slate-500"
                value={status}
                onChange={(event) => setStatus(event.target.value as TransactionStatus | '')}
              >
                <option value="">Todos</option>
                <option value="PENDING">PENDING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="FAILED">FAILED</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Tipo</span>
              <select
                className="h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-slate-500"
                value={type}
                onChange={(event) => setType(event.target.value as TransactionType | '')}
              >
                <option value="">Todos</option>
                <option value="PURCHASE">PURCHASE</option>
                <option value="REFUND">REFUND</option>
              </select>
            </label>
            <div className="flex items-end">
              <Button type="submit" className="w-full gap-2">
                <Search size={15} />
                Filtrar
              </Button>
            </div>
          </form>

          {error ? <p className="rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        </CardContent>
      </Card>

      <Card className="border border-zinc-200 bg-white shadow-[0_20px_50px_-38px_rgba(15,23,42,0.45)]">
        <CardContent className="space-y-4 p-4 sm:p-6">
          {loading ? (
            <p className="text-zinc-600">Carregando histórico...</p>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="min-w-[780px] w-full border-collapse">
                <thead>
                  <tr className="text-left">
                    <th className="border-b border-zinc-200 px-3 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Data</th>
                    <th className="border-b border-zinc-200 px-3 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Serviço</th>
                    <th className="border-b border-zinc-200 px-3 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Valor</th>
                    <th className="border-b border-zinc-200 px-3 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Tipo</th>
                    <th className="border-b border-zinc-200 px-3 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Status</th>
                    <th className="border-b border-zinc-200 px-3 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Cliente</th>
                    <th className="border-b border-zinc-200 px-3 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Prestador</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((tx) => (
                    <tr key={tx.id} className="text-sm text-zinc-700">
                      <td className="border-b border-zinc-100 px-3 py-3">{new Date(tx.createdAt).toLocaleString()}</td>
                      <td className="border-b border-zinc-100 px-3 py-3">{tx.service.title}</td>
                      <td className="border-b border-zinc-100 px-3 py-3">AOA {tx.amount}</td>
                      <td className="border-b border-zinc-100 px-3 py-3">{tx.type}</td>
                      <td className="border-b border-zinc-100 px-3 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em]',
                            tx.status === 'COMPLETED'
                              ? 'bg-sky-100 text-sky-700'
                              : tx.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                          )}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="border-b border-zinc-100 px-3 py-3">{tx.client.name}</td>
                      <td className="border-b border-zinc-100 px-3 py-3">{tx.provider.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Anterior
            </Button>
            <span className="text-sm text-zinc-600">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="ghost"
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Próxima
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
