import { ValidationPipe } from '@nestjs/common';
import { NestApplication } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import request from 'supertest';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { AppModule } from '../../../backend/src/app/app.module';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaService } from '../../../backend/src/prisma/prisma.service';

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    role: 'CLIENT' | 'PROVIDER';
    email: string;
    nif: string;
    balance: string;
  };
}

describe('Backend routes (DB + HTTP)', () => {
  jest.setTimeout(60000);

  let app: NestApplication;
  let prisma: PrismaService;
  const now = Date.now();
  const nifBase = 100000000 + (now % 800000000);

  let providerAuth: AuthResult;
  let clientAuth: AuthResult;
  let serviceId: string;
  let transactionId: string;
  let lowBalanceClientAuth: AuthResult;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    const swaggerConfig = new DocumentBuilder()
      .setTitle('Bulir Challenges API')
      .setDescription('Backend API documentation for auth, services, and transactions')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, swaggerDocument);

    await app.init();

    prisma = app.get(PrismaService);
    await prisma.transaction.deleteMany();
    await prisma.service.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany();
    await prisma.service.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  it('GET /api responds health payload', async () => {
    const response = await request(app.getHttpServer()).get('/api');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Hello API', status: 'ok' });
  });

  it('GET /api/docs exposes swagger UI', async () => {
    const response = await request(app.getHttpServer()).get('/api/docs');

    expect(response.status).toBe(200);
    expect(String(response.text)).toContain('swagger-ui');
  });

  it('POST /api/auth/register registers provider and client', async () => {
    const providerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Provider User',
        email: `provider-${now}@test.local`,
        nif: `${nifBase}`,
        password: 'password123',
        role: 'PROVIDER',
      });

    const clientRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Client User',
        email: `client-${now}@test.local`,
        nif: `${nifBase + 1}`,
        password: 'password123',
        role: 'CLIENT',
        balance: '250.00',
      });

    expect(providerRes.status).toBe(201);
    expect(clientRes.status).toBe(201);

    providerAuth = providerRes.body as AuthResult;
    clientAuth = clientRes.body as AuthResult;

    expect(providerAuth.accessToken).toBeTruthy();
    expect(clientAuth.accessToken).toBeTruthy();
    expect(providerAuth.refreshToken).toBeTruthy();
    expect(clientAuth.refreshToken).toBeTruthy();
  });

  it('POST /api/auth/refresh rotates refresh token and returns new access token', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: clientAuth.refreshToken });

    expect(response.status).toBe(201);
    expect(response.body.accessToken).toBeTruthy();
    expect(response.body.refreshToken).toBeTruthy();
    expect(response.body.refreshToken).not.toBe(clientAuth.refreshToken);
    expect(response.body.user.id).toBe(clientAuth.user.id);

    clientAuth = response.body as AuthResult;
  });

  it('POST /api/auth/login authenticates by email and by nif', async () => {
    const loginByEmail = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        identifier: providerAuth.user.email,
        password: 'password123',
      });

    const loginByNif = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        identifier: clientAuth.user.nif,
        password: 'password123',
      });

    expect(loginByEmail.status).toBe(201);
    expect(loginByNif.status).toBe(201);
    expect(loginByEmail.body.user.id).toBe(providerAuth.user.id);
    expect(loginByNif.body.user.id).toBe(clientAuth.user.id);
  });

  it('GET /api/users/me returns authenticated user', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${providerAuth.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(providerAuth.user.id);
    expect(response.body.role).toBe('PROVIDER');
  });

  it('POST /api/services creates service for provider', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/services')
      .set('Authorization', `Bearer ${providerAuth.accessToken}`)
      .send({
        title: 'Montagem de Móveis',
        description: 'Serviço completo de montagem de móveis residenciais.',
        price: '75.50',
      });

    expect(response.status).toBe(201);
    expect(response.body.ownerId).toBe(providerAuth.user.id);
    serviceId = response.body.id as string;
  });

  it('GET /api/services lists services with pagination metadata', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/services?page=1&pageSize=10')
      .set('Authorization', `Bearer ${providerAuth.accessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.meta.page).toBe(1);
    expect(response.body.items.some((item: { id: string }) => item.id === serviceId)).toBe(true);
  });

  it('GET /api/services/me lists only provider services', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/services/me?page=1&pageSize=10')
      .set('Authorization', `Bearer ${providerAuth.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.items.every((item: { ownerId: string }) => item.ownerId === providerAuth.user.id)).toBe(true);
  });

  it('PUT /api/services/:id updates provider service', async () => {
    const response = await request(app.getHttpServer())
      .put(`/api/services/${serviceId}`)
      .set('Authorization', `Bearer ${providerAuth.accessToken}`)
      .send({
        title: 'Montagem Premium',
        price: '80.00',
      });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Montagem Premium');
    expect(response.body.price).toBe('80');
  });

  it('POST /api/transactions performs atomic transfer with idempotency', async () => {
    const idempotencyKey = `idem-${now}`;

    const first = await request(app.getHttpServer())
      .post('/api/transactions')
      .set('Authorization', `Bearer ${clientAuth.accessToken}`)
      .send({
        serviceId,
        idempotencyKey,
      });

    const second = await request(app.getHttpServer())
      .post('/api/transactions')
      .set('Authorization', `Bearer ${clientAuth.accessToken}`)
      .send({
        serviceId,
        idempotencyKey,
      });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.id).toBe(second.body.id);

    transactionId = first.body.id as string;

    const provider = await prisma.user.findUniqueOrThrow({ where: { id: providerAuth.user.id } });
    const client = await prisma.user.findUniqueOrThrow({ where: { id: clientAuth.user.id } });

    expect(provider.balance.toString()).toBe('80');
    expect(client.balance.toString()).toBe('170');
  });

  it('GET /api/transactions lists transaction history', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/transactions?page=1&pageSize=10&type=PURCHASE&status=COMPLETED')
      .set('Authorization', `Bearer ${clientAuth.accessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.some((item: { id: string }) => item.id === transactionId)).toBe(true);
  });

  it('DELETE /api/services/:id deletes owned service', async () => {
    const tempService = await request(app.getHttpServer())
      .post('/api/services')
      .set('Authorization', `Bearer ${providerAuth.accessToken}`)
      .send({
        title: 'Serviço Temporário',
        description: 'Serviço temporário para validar a rota de delete sem transações.',
        price: '40.00',
      });

    const removableId = tempService.body.id as string;

    const response = await request(app.getHttpServer())
      .delete(`/api/services/${removableId}`)
      .set('Authorization', `Bearer ${providerAuth.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ deleted: true });
  });

  it('POST /api/transactions handles concurrent requests without overdraft', async () => {
    const lowBalanceClientRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Low Balance Client',
        email: `low-balance-${now}@test.local`,
        nif: `${nifBase + 2}`,
        password: 'password123',
        role: 'CLIENT',
        balance: '80.00',
      });

    expect(lowBalanceClientRes.status).toBe(201);
    lowBalanceClientAuth = lowBalanceClientRes.body as AuthResult;

    const [attemptA, attemptB] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${lowBalanceClientAuth.accessToken}`)
        .send({ serviceId, idempotencyKey: `race-${now}-a` }),
      request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${lowBalanceClientAuth.accessToken}`)
        .send({ serviceId, idempotencyKey: `race-${now}-b` }),
    ]);

    const statuses = [attemptA.status, attemptB.status].sort();
    expect(statuses).toEqual([201, 409]);

    const lowBalanceClient = await prisma.user.findUniqueOrThrow({
      where: { id: lowBalanceClientAuth.user.id },
    });
    expect(lowBalanceClient.balance.toString()).toBe('0');
  });
});
