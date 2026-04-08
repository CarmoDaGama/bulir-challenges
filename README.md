# Bulir Challenges

Monorepo for the bulir challenges with **NestJS Backend**, **Next.js Web App**, and **Expo React Native Mobile App**.

## Structure

```
bulir-challenges/
├── apps/
│   ├── backend/          ← NestJS (Desafio 1-3)
│   ├── web/              ← Next.js + TypeScript (Desafio 2-3)
│   └── mobile/           ← Expo React Native + TypeScript (Desafio 3-3)
├── libs/
│   ├── api-contracts/    ← Tipos e DTOs compartilhados
│   ├── ui/               ← Componentes compartilhados
│   └── utils/            ← Funções comuns
├── .github/workflows/    ← CI/CD Pipeline
├── .nvmrc                ← Node version (22)
├── nx.json               ← Nx configuration
├── tsconfig.base.json    ← Shared TypeScript config
├── .env.example          ← Environment variables template
└── README.md

```

## Stack

| App       | Technology                          | Database   |
|-----------|-------------------------------------|------------|
| Backend   | NestJS + TypeScript + Prisma        | PostgreSQL |
| Web       | Next.js 15 + TypeScript + Tailwind  | —          |
| Mobile    | Expo React Native + TypeScript      | —          |

## Prerequisites

- **Node.js**: 22 LTS (see `.nvmrc`)
- **npm**: 10+
- **PostgreSQL**: 13+

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

Copy `.env.example` to `.env.local` and update values:

```bash
cp .env.example .env.local
```

### 3. Available Scripts

**Lint code**:
```bash
npm run lint
```

**Run tests**:
```bash
npm run test
```

**Build all apps**:
```bash
npm run build
```

**Start all apps in dev mode**:
```bash
npm run dev
```

**Clean**:
```bash
npm run clean
```

## Backend Fase 1

Backend pronto com:

- Auth: register, login (email ou NIF) e refresh token.
- RBAC + ownership para CRUD de servicos.
- Transacao atomica de contratacao com idempotencia.
- Paginacao e filtros em servicos e transacoes.
- Testes unitarios + e2e com cenario de concorrencia.

Documentacao backend detalhada: `apps/backend/README.md`

Colecao Postman: `bulir-challenges.postman_collection.json`

## License

UNLICENSED

Uma plataforma onde clientes podem fazer reservas em diferentes serviços
