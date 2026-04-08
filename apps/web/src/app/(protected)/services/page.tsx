'use client';

import { Service } from '@bulir-challenges/api-contracts';
import { motion } from 'framer-motion';
import { Search, Star, TrendingUp } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../../components/auth-provider';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import * as api from '../../../lib/api';
import { getErrorMessage } from '../../../lib/errors';
import { cn } from '../../../lib/utils';

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

const MARKET_CATEGORIES = ['Design', 'Marketing', 'Web', 'Video', 'Musica', 'AI'];

function formatCurrency(price: string) {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 2,
  }).format(Number(price));
}

function getServiceRating(service: Service, index: number) {
  const raw = service.id
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const value = 4.1 + ((raw + index) % 9) / 10;
  return Math.min(5, Number(value.toFixed(1)));
}

function getServiceSales(service: Service, index: number) {
  const raw = service.title.length * 9 + service.description.length * 3 + index * 17;
  return 20 + (raw % 370);
}

export default function ServicesPage() {
  const { user, withAuth, refreshUser } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalServicesCount, setTotalServicesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [contractingServiceId, setContractingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceFormState>(EMPTY_SERVICE_FORM);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isDarkMode = false;

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
      setTotalServicesCount(result.meta.total);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [isProvider, page, pageSize, query, withAuth]);

  useEffect(() => {
    void refreshServices();
  }, [refreshServices]);

  useEffect(() => {
    if (!isServiceModalOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isServiceModalOpen]);

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
      setIsServiceModalOpen(false);
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
    setIsServiceModalOpen(true);
    setMessage(null);
    setError(null);
  };

  const openCreateModal = () => {
    setEditingServiceId(null);
    setServiceForm(EMPTY_SERVICE_FORM);
    setIsServiceModalOpen(true);
    setError(null);
    setMessage(null);
  };

  const closeModal = () => {
    setIsServiceModalOpen(false);
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
      return 'Gestao de servicos';
    }
    return 'Marketplace de servicos';
  }, [isProvider]);

  const featuredServices = useMemo(
    () => [...services].sort((a, b) => Number(b.price) - Number(a.price)).slice(0, 6),
    [services]
  );

  const averagePrice = useMemo(() => {
    if (!services.length) return 0;
    const total = services.reduce((sum, service) => sum + Number(service.price), 0);
    return total / services.length;
  }, [services]);

  const topGrowth = useMemo(() => {
    if (!services.length) return 0;
    const baseline = services.reduce((sum, service, index) => sum + getServiceSales(service, index), 0);
    return Math.min(480, Math.round(baseline / services.length));
  }, [services]);

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
            : 'bg-gradient-to-br from-zinc-50 via-lime-50 to-emerald-50'
        )}
      >
        <div className="pointer-events-none absolute -left-10 top-10 h-48 w-48 rounded-full bg-lime-400/75 blur-3xl" />
        <div className="pointer-events-none absolute bottom-6 right-8 h-24 w-24 rounded-full bg-rose-400/50 blur-2xl" />

        <CardContent className="relative grid gap-6 p-6 md:grid-cols-[1.1fr,0.9fr] md:p-9">
          <div className="space-y-5">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/35 bg-emerald-300/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-500">
              <TrendingUp size={14} />
              Mercado vivo
            </div>

            <div className="space-y-3">
              <h2 className={cn('text-4xl font-semibold leading-tight md:text-5xl', isDarkMode ? 'text-white' : 'text-zinc-900')}>
                {title}
              </h2>
              <p className={cn('max-w-xl text-sm md:text-base', isDarkMode ? 'text-zinc-300' : 'text-zinc-600')}>
                Descubra especialistas com cards visuais, preco claro, rating alto e contratacao em um clique.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className={cn('pointer-events-none absolute left-3 top-1/2 -translate-y-1/2', isDarkMode ? 'text-zinc-400' : 'text-zinc-500')} size={16} />
                <input
                  className={cn(
                    'h-11 w-full rounded-2xl border pl-9 pr-3 text-sm outline-none transition',
                    isDarkMode
                      ? 'border-zinc-700/80 bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-500 focus:border-lime-400/70'
                      : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500'
                  )}
                  placeholder="Busque servico, prestador ou categoria"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <Button type="button" onClick={() => void refreshServices()}>
                Buscar
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {MARKET_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setQuery(category)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition',
                    isDarkMode
                      ? 'border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:border-lime-400/50'
                      : 'border-zinc-300 bg-white text-zinc-700 hover:border-emerald-500'
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div
              className={cn(
                'rounded-2xl border p-4',
                isDarkMode ? 'border-zinc-800 bg-zinc-900/70 text-zinc-100' : 'border-zinc-200 bg-white text-zinc-900'
              )}
            >
              <p className={cn('text-xs uppercase tracking-[0.16em]', isDarkMode ? 'text-zinc-400' : 'text-zinc-500')}>Servico ativos</p>
              <p className="pt-2 text-3xl font-semibold">{totalServicesCount || services.length}</p>
            </div>
            <div
              className={cn(
                'rounded-2xl border p-4',
                isDarkMode ? 'border-zinc-800 bg-zinc-900/70 text-zinc-100' : 'border-zinc-200 bg-white text-zinc-900'
              )}
            >
              <p className={cn('text-xs uppercase tracking-[0.16em]', isDarkMode ? 'text-zinc-400' : 'text-zinc-500')}>Preco medio</p>
              <p className="pt-2 text-3xl font-semibold">{formatCurrency(String(averagePrice || 0))}</p>
            </div>
            <div
              className={cn(
                'col-span-2 rounded-2xl border p-4',
                isDarkMode ? 'border-zinc-800 bg-zinc-900/70 text-zinc-100' : 'border-zinc-200 bg-white text-zinc-900'
              )}
            >
              <p className={cn('text-xs uppercase tracking-[0.16em]', isDarkMode ? 'text-zinc-400' : 'text-zinc-500')}>Crescimento medio</p>
              <p className="pt-2 text-3xl font-semibold text-emerald-500">+{topGrowth || 480}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <p className={cn('rounded-xl px-3 py-2 text-sm', isDarkMode ? 'bg-rose-400/20 text-rose-100' : 'bg-rose-100 text-rose-700')}>
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          className={cn(
            'rounded-xl px-3 py-2 text-sm',
            isDarkMode ? 'bg-emerald-400/20 text-emerald-100' : 'bg-emerald-100 text-emerald-700'
          )}
        >
          {message}
        </p>
      ) : null}

      {isProvider ? (
        <Card className={cn('border-0', isDarkMode ? 'bg-zinc-900/80' : 'bg-white')}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className={cn('text-xl font-semibold', isDarkMode ? 'text-zinc-100' : 'text-zinc-900')}>Painel de prestador</h3>
              <p className={cn('text-sm', isDarkMode ? 'text-zinc-400' : 'text-zinc-600')}>
                Crie ou edite seus servicos com modal.
              </p>
            </div>
            <Button type="button" onClick={openCreateModal}>
              Novo servico
            </Button>
          </div>
        </Card>
      ) : null}

      {isServiceModalOpen && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true">
              <button
                type="button"
                className="absolute inset-0 bg-black/50 backdrop-blur-[3px]"
                onClick={closeModal}
                aria-label="Fechar modal"
              />

              <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[28px] border border-zinc-200 bg-white text-zinc-900 shadow-[0_40px_110px_-35px_rgba(15,23,42,0.55)]">
                <div className="relative border-b border-zinc-200/80 bg-gradient-to-r from-lime-50 via-emerald-50 to-white px-6 py-5 sm:px-7">
                  <div className="pointer-events-none absolute -left-6 top-0 h-20 w-20 rounded-full bg-lime-300/45 blur-2xl" />
                  <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-full bg-rose-300/35 blur-2xl" />
                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Bulir Studio</p>
                      <h4 className="pt-1 text-2xl font-semibold leading-tight">{editingServiceId ? 'Editar servico' : 'Novo servico'}</h4>
                      <p className="pt-1 text-sm text-zinc-600">Preencha os detalhes para publicar no marketplace.</p>
                    </div>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700"
                      aria-label="Fechar"
                    >
                      x
                    </button>
                  </div>
                </div>

                <form id="service-modal-form" onSubmit={submitCreateOrUpdate} className="space-y-5 px-6 py-6 sm:px-7">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">Titulo</span>
                      <input
                        className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                        value={serviceForm.title}
                        onChange={(event) => setServiceForm((prev) => ({ ...prev, title: event.target.value }))}
                        minLength={3}
                        placeholder="Ex: Design de logotipo premium"
                        required
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">Preco (AOA)</span>
                      <input
                        className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                        value={serviceForm.price}
                        onChange={(event) => setServiceForm((prev) => ({ ...prev, price: event.target.value }))}
                        placeholder="5000.00"
                        required
                      />
                    </label>

                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">Descricao</span>
                      <textarea
                        className="min-h-32 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                        value={serviceForm.description}
                        onChange={(event) => setServiceForm((prev) => ({ ...prev, description: event.target.value }))}
                        minLength={10}
                        placeholder="Descreva o que esta incluido no servico, prazo e diferenciais."
                        required
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-zinc-200 pt-4">
                    <Button variant="ghost" type="button" onClick={closeModal}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Salvando...' : editingServiceId ? 'Atualizar' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )
        : null}

      <Card className={cn('border-0', isDarkMode ? 'bg-zinc-900/75' : 'bg-white')}>
        <CardHeader>
          <CardTitle className={cn(isDarkMode ? 'text-zinc-100' : 'text-zinc-900')}>Servicos em destaque</CardTitle>
          <CardDescription className={cn(isDarkMode ? 'text-zinc-400' : 'text-zinc-600')}>
            Cards visuais grandes, com preco destacado, rating e botao de contratacao rapida.
          </CardDescription>
        </CardHeader>

        {loading ? <p className={cn('text-sm', isDarkMode ? 'text-zinc-400' : 'text-zinc-600')}>Carregando servicos...</p> : null}

        {!loading && featuredServices.length === 0 ? (
          <Card className={cn('border', isDarkMode ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-zinc-50')}>
            <CardDescription className={cn(isDarkMode ? 'text-zinc-300' : 'text-zinc-600')}>
              Nenhum servico encontrado com os filtros atuais.
            </CardDescription>
          </Card>
        ) : null}

        {!loading && featuredServices.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featuredServices.map((service, index) => {
              const isOwnedByUser = service.ownerId === user?.id;
              const rating = getServiceRating(service, index);
              const sales = getServiceSales(service, index);

              return (
                <motion.article
                  key={service.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(index * 0.05, 0.25) }}
                  whileHover={{ y: -8 }}
                  className={cn(
                    'overflow-hidden rounded-3xl border',
                    isDarkMode
                      ? 'border-zinc-800 bg-zinc-950/90 shadow-[0_26px_50px_-35px_rgba(0,0,0,0.95)]'
                      : 'border-zinc-200 bg-white shadow-[0_20px_42px_-32px_rgba(15,23,42,0.45)]'
                  )}
                >
                  <div
                    className={cn(
                      'relative h-44 overflow-hidden',
                      index % 3 === 0 && 'bg-gradient-to-br from-emerald-400 to-lime-500',
                      index % 3 === 1 && 'bg-gradient-to-br from-cyan-500 to-blue-600',
                      index % 3 === 2 && 'bg-gradient-to-br from-orange-400 to-rose-500'
                    )}
                  >
                    <div className="absolute left-4 top-4 rounded-full bg-black/20 px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/90">
                      Top choice
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                      <div>
                        <p className="text-xs text-white/85">Prestador</p>
                        <p className="text-lg font-semibold text-white">{service.owner?.name ?? 'Equipe Bulir'}</p>
                      </div>
                      <p className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
                        {formatCurrency(service.price)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 p-4">
                    <h3 className={cn('text-lg font-semibold leading-snug', isDarkMode ? 'text-zinc-100' : 'text-zinc-900')}>
                      {service.title}
                    </h3>
                    <p className={cn('line-clamp-2 text-sm', isDarkMode ? 'text-zinc-400' : 'text-zinc-600')}>
                      {service.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-1 text-xs font-medium text-amber-500">
                        <Star size={14} fill="currentColor" />
                        {rating} ({sales})
                      </div>
                      <span className={cn('text-xs uppercase tracking-[0.13em]', isDarkMode ? 'text-zinc-500' : 'text-zinc-500')}>
                        Entrega rapida
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {user?.role === 'PROVIDER' && isOwnedByUser ? (
                        <>
                          <Button variant="ghost" type="button" onClick={() => startEdit(service)}>
                            Editar
                          </Button>
                          <Button variant="danger" type="button" onClick={() => void removeService(service.id)}>
                            Remover
                          </Button>
                        </>
                      ) : null}

                      {user?.role === 'CLIENT' ? (
                        <Button
                          type="button"
                          disabled={contractingServiceId === service.id}
                          onClick={() => void contractService(service)}
                        >
                          {contractingServiceId === service.id ? 'Contratando...' : 'Contratar agora'}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        ) : null}
      </Card>

      <Card className={cn('border-0 py-4', isDarkMode ? 'bg-zinc-900/75' : 'bg-white')}>
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-sm', isDarkMode ? 'text-zinc-400' : 'text-zinc-600')}>
            Pagina {page} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" type="button" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
              Anterior
            </Button>
            <Button variant="ghost" type="button" disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)}>
              Proxima
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
