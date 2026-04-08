# Backend (Fase 1)

Backend NestJS com PostgreSQL + Prisma para autenticação, serviços e transações atomicas.

## Endpoints

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- GET /api/users/me
- POST /api/services
- GET /api/services
- GET /api/services/me
- PUT /api/services/:id
- DELETE /api/services/:id
- POST /api/transactions
- GET /api/transactions

## Regras de negocio implementadas

- Apenas PROVIDER cria/edita/remove servicos.
- Apenas dono do servico pode editar/remover.
- Saldo do CLIENT nunca fica negativo em compras.
- Compra cria debito e credito na mesma transacao de banco.
- Idempotencia para evitar cobranca duplicada por retry.

## Seguranca

- Senhas com hash `bcrypt`.
- JWT com expiracao configuravel (`JWT_EXPIRATION`).
- Refresh token com rotacao e revogacao no banco.
- Rate limit nos endpoints de auth (`register`, `login`, `refresh`).

## Variaveis de ambiente

Use `.env.example` na raiz como referencia.

Campos principais:

- DATABASE_URL
- DIRECT_URL
- JWT_SECRET
- JWT_EXPIRATION
- REFRESH_TOKEN_EXPIRATION

## Comandos uteis

Na raiz do monorepo:

- `npm run prisma:migrate:dev`
- `npm run prisma:generate`
- `npx nx serve backend`
- `npx nx test backend`
- `npx nx e2e backend-e2e`
