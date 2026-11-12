import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { AppModule } from './app.module';

describe('Financial Risk API', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    jwt = module.get(JwtService);

    const adminLogin = await request(app.getHttpServer())
      .post('/login')
      .send({ username: 'admin', password: 'admin123' });
    const userLogin = await request(app.getHttpServer())
      .post('/login')
      .send({ username: 'user', password: 'user123' });

    adminToken = adminLogin.body.accessToken as string;
    userToken = userLogin.body.accessToken as string;
  });

  afterAll(async () => {
    await app.close();
  });

  it('logs in an admin without exposing credentials in the token', () => {
    expect(adminToken).toEqual(expect.any(String));
    expect(adminToken.split('.')).toHaveLength(3);
    expect(adminToken).not.toContain('admin123');
  });

  it('logs in a user with its normalized RUT claim', async () => {
    const response = await request(app.getHttpServer())
      .post('/login')
      .send({ username: 'user', password: 'user123' });

    expect(response.status).toBe(201);
    expect(response.body.user.rut).toBe('12345678-5');
  });

  it('rejects invalid credentials and malformed login bodies', async () => {
    const invalidCredentials = await request(app.getHttpServer())
      .post('/login')
      .send({ username: 'admin', password: 'wrong' });
    const invalidBody = await request(app.getHttpServer())
      .post('/login')
      .send({ username: 'admin' });

    expect(invalidCredentials.status).toBe(401);
    expect(invalidBody.status).toBe(400);
  });

  it('rejects a request without a token', async () => {
    const response = await request(app.getHttpServer()).get(
      '/score/12.345.678-5',
    );

    expect(response.status).toBe(401);
  });

  it('rejects a token with an invalid signature', async () => {
    const parts = adminToken.split('.');
    parts[2] = `${parts[2]}tampered`;

    const response = await request(app.getHttpServer())
      .get('/score/12.345.678-5')
      .set('Authorization', `Bearer ${parts.join('.')}`);

    expect(response.status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const expiredToken = await jwt.signAsync(
      { sub: 'user-admin-1', role: 'admin' },
      { algorithm: 'HS256', expiresIn: '-1s' },
    );
    const response = await request(app.getHttpServer())
      .get('/score/12.345.678-5')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
  });

  it('rejects a token signed with an unexpected algorithm', async () => {
    const wrongAlgorithmToken = await jwt.signAsync(
      { sub: 'user-admin-1', role: 'admin' },
      { algorithm: 'HS512' },
    );
    const response = await request(app.getHttpServer())
      .get('/score/12.345.678-5')
      .set('Authorization', `Bearer ${wrongAlgorithmToken}`);

    expect(response.status).toBe(401);
  });

  it('allows an admin to consult any valid RUT', async () => {
    const response = await request(app.getHttpServer())
      .get('/score/11.111.111-1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.rut).toBe('11.111.111-1');
    expect(response.body.score).toBeGreaterThanOrEqual(0);
    expect(response.body.score).toBeLessThanOrEqual(100);
    expect(response.body.fecha).toEqual(expect.any(String));
  });

  it('allows a user to consult its own RUT in equivalent formats', async () => {
    const response = await request(app.getHttpServer())
      .get('/score/12.345.678-5')
      .set('Authorization', `Bearer ${userToken}`);
    const equivalent = await request(app.getHttpServer())
      .get('/score/12345678-5')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(equivalent.status).toBe(200);
    expect(response.body.score).toBe(equivalent.body.score);
  });

  it('forbids a user from consulting another valid RUT', async () => {
    const response = await request(app.getHttpServer())
      .get('/score/11.111.111-1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403);
  });

  it('returns 400 for an invalid RUT', async () => {
    const response = await request(app.getHttpServer())
      .get('/score/12.345.678-9')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
  });
});
