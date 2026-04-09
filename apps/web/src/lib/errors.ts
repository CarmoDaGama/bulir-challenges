import { ApiError } from './http';

const ERROR_MAP: Record<number, string> = {
  400: 'Dados inválidos. Revise os campos e tente novamente.',
  401: 'Sessão expirada. Entre novamente.',
  403: 'Você não tem permissão para está ação.',
  404: 'Recurso não encontrado.',
  409: 'Conflito de negócio. Verifique o saldo ou estado atual.',
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.message && !error.message.startsWith('Request failed')) {
      return error.message;
    }

    return ERROR_MAP[error.statusCode] ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Erro inesperado. Tente novamente.';
}
