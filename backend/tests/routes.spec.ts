import request from 'supertest';
import { app, server } from '../src/index';

describe('Express REST Routing Integration Tests', () => {

  afterAll((done) => {
    // Terminate server bindings cleanly to avoid hanging handles during Jest execution
    server.close(done);
  });

  test('GET / returns correct server welcome message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'online');
    expect(response.body).toHaveProperty('service', 'Travel Planning & Experience Engine API');
  });

  test('GET /api/trips without Authorization header returns 401 Unauthorized', async () => {
    const response = await request(app).get('/api/trips');
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'Unauthorized: No token provided');
  });

  test('GET /api/trips with mock Bearer token returns 200 and successful trips array', async () => {
    const response = await request(app)
      .get('/api/trips')
      .set('Authorization', 'Bearer mock-tester-999');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('POST /api/trips with empty parameters returns 400 Bad Request input validation error', async () => {
    const response = await request(app)
      .post('/api/trips')
      .set('Authorization', 'Bearer mock-tester-999')
      .send({
        source: '',
        destination: '',
        startDate: '',
        endDate: '',
        totalBudget: -100,
        travelStyle: 'invalid-style',
        numTravelers: 0
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('errors');
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  test('GET /api/weather/forecast with destination returns 200 weather list', async () => {
    const response = await request(app)
      .get('/api/weather/forecast?destination=Tokyo&days=3')
      .set('Authorization', 'Bearer mock-tester-999');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data.length).toBe(3);
    expect(response.body.data[0]).toHaveProperty('tempDay');
    expect(response.body.data[0]).toHaveProperty('condition');
  });

  test('GET /api/weather/forecast without destination returns 400 Bad Request', async () => {
    const response = await request(app)
      .get('/api/weather/forecast')
      .set('Authorization', 'Bearer mock-tester-999');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
  });

});
