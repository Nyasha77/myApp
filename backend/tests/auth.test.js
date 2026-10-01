process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://unused:unused@localhost:5432/unused';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const bcrypt = require('bcrypt');
const request = require('supertest');

const REAL_PASSWORD = 'correct-horse-battery-staple';
let mockUser;

jest.mock('../src/database/db', () => {
  const builder = {
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    first: jest.fn(() => Promise.resolve(global.__mockUser || null)),
  };
  const db = jest.fn(() => builder);
  return db;
});

const app = require('../src/app');

beforeAll(async () => {
  mockUser = {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    password_hash: await bcrypt.hash(REAL_PASSWORD, 10),
    timezone: 'Africa/Windhoek',
  };
});

describe('POST /api/auth/login', () => {
  test('correct credentials return a token and user payload', async () => {
    global.__mockUser = mockUser;
    const res = await request(app).post('/api/auth/login').send({ identifier: 'admin', password: REAL_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe('admin');
  });

  test('incorrect password is rejected', async () => {
    global.__mockUser = mockUser;
    const res = await request(app).post('/api/auth/login').send({ identifier: 'admin', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  test('unknown user is rejected', async () => {
    global.__mockUser = null;
    const res = await request(app).post('/api/auth/login').send({ identifier: 'ghost', password: 'anything' });
    expect(res.status).toBe(401);
  });

  test('missing fields are rejected by validation', async () => {
    const res = await request(app).post('/api/auth/login').send({ identifier: 'admin' });
    expect(res.status).toBe(400);
  });
});

describe('protected routes', () => {
  test('a request with no token is rejected', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(401);
  });

  test('a request with an invalid token is rejected', async () => {
    const res = await request(app).get('/api/dashboard').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});
