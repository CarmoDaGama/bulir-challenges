'use client';

import { TransactionStatus, TransactionType } from '@bulir-challenges/api-contracts';
import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { getErrorMessage } from '../../../lib/errors';
import * as api from '../../../lib/api';

export default function TransactionsPage() {
  const { withAuth } = useAuth();

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
    <section className="space-y-4">
      <div className="panel p-4 sm:p-6">
        <h2 className="text-2xl">Historico de transacoes</h2>
        <p className="mt-1 text-sm text-slate-300">Filtros por periodo, status e tipo com paginacao.</p>

        <form onSubmit={onFilterSubmit} className="mt-4 grid gap-3 sm:grid-cols-5">
          <label className="space-y-2">
            <span className="label">De</span>
            <input className="input" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label className="space-y-2">
            <span className="label">Ate</span>
            <input className="input" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </label>
          <label className="space-y-2">
            <span className="label">Status</span>
            <select className="select" value={status} onChange={(event) => setStatus(event.target.value as TransactionStatus | '')}>
              <option value="">Todos</option>
              <option value="PENDING">PENDING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="label">Tipo</span>
            <select className="select" value={type} onChange={(event) => setType(event.target.value as TransactionType | '')}>
              <option value="">Todos</option>
              <option value="PURCHASE">PURCHASE</option>
              <option value="REFUND">REFUND</option>
            </select>
          </label>
          <div className="flex items-end">
            <button className="btn btn-primary w-full" type="submit">
              Filtrar
            </button>
          </div>
        </form>

        {error ? <p className="mt-4 rounded-xl bg-rose-400/20 px-3 py-2 text-sm text-rose-100">{error}</p> : null}
      </div>

      <div className="panel p-4 sm:p-6">
        {loading ? (
          <p className="text-slate-300">Carregando historico...</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Servico</th>
                  <th>Valor</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Cliente</th>
                  <th>Prestador</th>
                </tr>
              </thead>
              <tbody>
                {items.map((tx) => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.createdAt).toLocaleString()}</td>
                    <td>{tx.service.title}</td>
                    <td>AOA{tx.amount}</td>
                    <td>{tx.type}</td>
                    <td>
                      <span className={`status ${tx.status === 'COMPLETED' ? 'status-ok' : 'status-error'}`}>{tx.status}</span>
                    </td>
                    <td>{tx.client.name}</td>
                    <td>{tx.provider.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            className="btn btn-ghost"
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Anterior
          </button>
          <span className="text-sm text-slate-300">
            Pagina {page} de {totalPages}
          </span>
          <button
            className="btn btn-ghost"
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Proxima
          </button>
        </div>
      </div>
    </section>
  );
}
