import {
  AuthResponse,
  AuthResponseSchema,
  AuthUser,
  AuthUserSchema,
  LoginInput,
  PaginatedServices,
  PaginatedServicesSchema,
  PaginatedTransactions,
  PaginatedTransactionsSchema,
  RegisterInput,
  Service,
  ServiceSchema,
  Transaction,
  TransactionSchema,
  TransactionStatus,
  TransactionType,
} from '@bulir-challenges/api-contracts';
import { requestJson } from './http';

export async function login(input: LoginInput): Promise<AuthResponse> {
  const data = await requestJson<unknown>('/auth/login', {
    method: 'POST',
    body: input,
  });
  return AuthResponseSchema.parse(data);
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const data = await requestJson<unknown>('/auth/register', {
    method: 'POST',
    body: input,
  });
  return AuthResponseSchema.parse(data);
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  const data = await requestJson<unknown>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  });
  return AuthResponseSchema.parse(data);
}

export async function getMe(token: string): Promise<AuthUser> {
  const data = await requestJson<unknown>('/users/me', { token });
  return AuthUserSchema.parse(data);
}

export interface ListServicesParams {
  page?: number;
  pageSize?: number;
  query?: string;
  mine?: boolean;
}

export async function listServices(token: string, params: ListServicesParams = {}): Promise<PaginatedServices> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('pageSize', String(params.pageSize ?? 10));
  if (params.query) {
    query.set('query', params.query);
  }

  const basePath = params.mine ? '/services/me' : '/services';
  const data = await requestJson<unknown>(`${basePath}?${query.toString()}`, { token });
  return PaginatedServicesSchema.parse(data);
}

export async function createService(
  token: string,
  input: { title: string; description: string; price: string }
): Promise<Service> {
  const data = await requestJson<unknown>('/services', {
    method: 'POST',
    token,
    body: input,
  });
  return ServiceSchema.parse(data);
}

export async function updateService(
  token: string,
  serviceId: string,
  input: { title?: string; description?: string; price?: string }
): Promise<Service> {
  const data = await requestJson<unknown>(`/services/${serviceId}`, {
    method: 'PUT',
    token,
    body: input,
  });
  return ServiceSchema.parse(data);
}

export async function deleteService(token: string, serviceId: string): Promise<{ deleted: true }> {
  return requestJson<{ deleted: true }>(`/services/${serviceId}`, {
    method: 'DELETE',
    token,
  });
}

export async function createTransaction(
  token: string,
  input: { serviceId: string; idempotencyKey: string }
): Promise<Transaction> {
  const data = await requestJson<unknown>('/transactions', {
    method: 'POST',
    token,
    body: input,
  });
  return TransactionSchema.parse(data);
}

export interface ListTransactionsParams {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
  status?: TransactionStatus;
  type?: TransactionType;
}

export async function listTransactions(
  token: string,
  params: ListTransactionsParams = {}
): Promise<PaginatedTransactions> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('pageSize', String(params.pageSize ?? 10));
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  if (params.status) query.set('status', params.status);
  if (params.type) query.set('type', params.type);

  const data = await requestJson<unknown>(`/transactions?${query.toString()}`, { token });
  return PaginatedTransactionsSchema.parse(data);
}
