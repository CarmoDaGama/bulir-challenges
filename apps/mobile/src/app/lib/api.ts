import type {
  AuthResponse,
  AuthUser,
  LoginInput,
  PaginatedServices,
  PaginatedTransactions,
  RegisterInput,
  Service,
  Transaction,
  TransactionStatus,
  TransactionType,
} from '@bulir-challenges/api-contracts';
import { requestJson } from './http';

export async function login(input: LoginInput): Promise<AuthResponse> {
  return requestJson<AuthResponse>('/auth/login', {
    method: 'POST',
    body: input,
  });
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  return requestJson<AuthResponse>('/auth/register', {
    method: 'POST',
    body: input,
  });
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  return requestJson<AuthResponse>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  });
}

export async function getMe(token: string): Promise<AuthUser> {
  return requestJson<AuthUser>('/users/me', { token });
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
  return requestJson<PaginatedServices>(`${basePath}?${query.toString()}`, { token });
}

export async function createService(
  token: string,
  input: { title: string; description: string; price: string }
): Promise<Service> {
  return requestJson<Service>('/services', {
    method: 'POST',
    token,
    body: input,
  });
}

export async function updateService(
  token: string,
  serviceId: string,
  input: { title?: string; description?: string; price?: string }
): Promise<Service> {
  return requestJson<Service>(`/services/${serviceId}`, {
    method: 'PUT',
    token,
    body: input,
  });
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
  return requestJson<Transaction>('/transactions', {
    method: 'POST',
    token,
    body: input,
  });
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

  return requestJson<PaginatedTransactions>(`/transactions?${query.toString()}`, { token });
}
