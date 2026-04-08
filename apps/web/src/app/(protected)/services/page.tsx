'use client';

import { Service } from '@bulir-challenges/api-contracts';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { getErrorMessage } from '../../../lib/errors';
import * as api from '../../../lib/api';

interface ServiceFormState {
  title: string;
  description: string;
  price: string;
}

const EMPTY_SERVICE_FORM: ServiceFormState = {
  title: '',
  description: '',
  price: '',
};

export default function ServicesPage() {
  const { user, withAuth, refreshUser } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contractingServiceId, setContractingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceFormState>(EMPTY_SERVICE_FORM);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isProvider = user?.role === 'PROVIDER';

  const refreshServices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await withAuth((token) =>
        api.listServices(token, {
          page,
          pageSize,
          query: query.trim() || undefined,
          mine: isProvider,
        })
      );
      setServices(result.items);
      setTotalPages(result.meta.totalPages);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [isProvider, page, pageSize, query, withAuth]);

  useEffect(() => {
    void refreshServices();
  }, [refreshServices]);

  const submitCreateOrUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        title: serviceForm.title.trim(),
        description: serviceForm.description.trim(),
        price: serviceForm.price.trim(),
      };

      if (editingServiceId) {
        await withAuth((token) => api.updateService(token, editingServiceId, payload));
        setMessage('Servico atualizado com sucesso.');
      } else {
        await withAuth((token) => api.createService(token, payload));
        setMessage('Servico criado com sucesso.');
      }

      setServiceForm(EMPTY_SERVICE_FORM);
      setEditingServiceId(null);
      await refreshServices();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (service: Service) => {
    setEditingServiceId(service.id);
    setServiceForm({
      title: service.title,
      description: service.description,
      price: service.price,
    });
    setMessage(null);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingServiceId(null);
    setServiceForm(EMPTY_SERVICE_FORM);
  };

  const removeService = async (serviceId: string) => {
    setError(null);
    setMessage(null);

    try {
      await withAuth((token) => api.deleteService(token, serviceId));
      setMessage('Servico removido.');
      await refreshServices();
    } catch (removeError) {
      setError(getErrorMessage(removeError));
    }
  };

  const contractService = async (service: Service) => {
    if (!user || user.role !== 'CLIENT') return;

    const currentBalance = Number(user.balance);
    const servicePrice = Number(service.price);

    if (currentBalance < servicePrice) {
      setError('Saldo insuficiente para esta contratacao.');
      return;
    }

    setContractingServiceId(service.id);
    setError(null);
    setMessage(null);

    try {
      const idempotencyKey = `web-${crypto.randomUUID()}`;
      await withAuth((token) =>
        api.createTransaction(token, {
          serviceId: service.id,
          idempotencyKey,
        })
      );
      await refreshUser();
      setMessage('Servico contratado com sucesso.');
    } catch (contractError) {
      setError(getErrorMessage(contractError));
    } finally {
      setContractingServiceId(null);
    }
  };

  const title = useMemo(() => {
    if (isProvider) {
      return 'Meus servicos';
    }

    return 'Servicos disponiveis';
  }, [isProvider]);

  return (
    <section className="space-y-4">
      <div className="panel p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl">{title}</h2>
            <p className="mt-1 text-sm text-slate-300">
              Busca com paginacao e regras de papel aplicadas no backend.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <input
              className="input"
              placeholder="Buscar por titulo ou descricao"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button className="btn btn-ghost" type="button" onClick={() => void refreshServices()}>
              Buscar
            </button>
          </div>
        </div>

        {error ? <p className="mt-4 rounded-xl bg-rose-400/20 px-3 py-2 text-sm text-rose-100">{error}</p> : null}
        {message ? <p className="mt-4 rounded-xl bg-emerald-400/20 px-3 py-2 text-sm text-emerald-100">{message}</p> : null}
      </div>

      {isProvider ? (
        <form onSubmit={submitCreateOrUpdate} className="panel grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
          <h3 className="col-span-full text-xl">{editingServiceId ? 'Editar servico' : 'Novo servico'}</h3>
          <label className="space-y-2 sm:col-span-1">
            <span className="label">Titulo</span>
            <input
              className="input"
              value={serviceForm.title}
              onChange={(event) => setServiceForm((prev) => ({ ...prev, title: event.target.value }))}
              minLength={3}
              required
            />
          </label>
          <label className="space-y-2 sm:col-span-1">
            <span className="label">Preço</span>
            <input
              className="input"
              value={serviceForm.price}
              onChange={(event) => setServiceForm((prev) => ({ ...prev, price: event.target.value }))}
              placeholder="50.00"
              required
            />
          </label>
          <label className="space-y-2 sm:col-span-full">
            <span className="label">Descricao</span>
            <textarea
              className="textarea"
              value={serviceForm.description}
              onChange={(event) => setServiceForm((prev) => ({ ...prev, description: event.target.value }))}
              minLength={10}
              required
            />
          </label>

          <div className="col-span-full flex flex-wrap gap-2">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Salvando...' : editingServiceId ? 'Atualizar' : 'Criar'}
            </button>
            {editingServiceId ? (
              <button className="btn btn-ghost" type="button" onClick={cancelEdit}>
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className="panel p-4 sm:p-6">
        {loading ? (
          <p className="text-slate-300">Carregando servicos...</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Titulo</th>
                  <th>Descrição</th>
                  <th>Preço</th>
                  <th>Prestador</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => {
                  const isOwnedByUser = service.ownerId === user?.id;
                  return (
                    <tr key={service.id}>
                      <td>{service.title}</td>
                      <td>{service.description}</td>
                      <td>AOA {service.price}</td>
                      <td>{service.owner?.name ?? 'N/A'}</td>
                      <td>
                        <div className="flex gap-2">
                          {user?.role === 'PROVIDER' && isOwnedByUser ? (
                            <>
                              <button className="btn btn-ghost" type="button" onClick={() => startEdit(service)}>
                                Editar
                              </button>
                              <button className="btn btn-danger" type="button" onClick={() => void removeService(service.id)}>
                                Remover
                              </button>
                            </>
                          ) : null}

                          {user?.role === 'CLIENT' ? (
                            <button
                              className="btn btn-primary"
                              type="button"
                              disabled={contractingServiceId === service.id}
                              onClick={() => void contractService(service)}
                            >
                              {contractingServiceId === service.id ? 'Contratando...' : 'Contratar'}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
