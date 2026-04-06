import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

type LoginResponseBody = {
  accessToken: string;
};

type UsersResponseBody = {
  users: Array<{
    username: string;
  }>;
};

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('POST /register -> POST /login -> GET /users', async () => {
    const uniqueId = Date.now().toString();
    const username = `bob_${uniqueId}`;
    const email = `${username}@mail.com`;

    await request(app.getHttpServer()).post('/register').send({
      username,
      email,
      password: 'secret123',
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send({
        identifier: username,
        password: 'secret123',
      });
    const loginBody = loginResponse.body as LoginResponseBody;

    expect(loginResponse.status).toBe(201);
    expect(loginBody.accessToken).toBeDefined();

    const usersResponse = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${loginBody.accessToken}`);
    const usersBody = usersResponse.body as UsersResponseBody;

    expect(usersResponse.status).toBe(200);
    expect(usersBody.users.some((entry) => entry.username === username)).toBe(
      true,
    );
  });

  it('GET /users trả lỗi 401 nếu token sai', () => {
    return request(app.getHttpServer())
      .get('/users')
      .set('Authorization', 'Bearer invalid.token.value')
      .expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});
