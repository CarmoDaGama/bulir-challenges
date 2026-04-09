import { ApiError } from './http';

const ERROR_MAP: Record<number, string> = {
  400: 'Dados invalidos. Revise os campos e tente novamente.',
  401: 'Sessao expirada. Entre novamente.',
  403: 'Voce nao tem permissao para esta acao.',
  404: 'Recurso nao encontrado.',
  409: 'Conflito de negocio. Verifique saldo ou estado atual.',
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
