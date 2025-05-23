// tests/integration/health.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('Health Endpoints', () => {
  describe('GET /health', () => {
    it('devrait retourner le statut de santé du serveur', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'OK',
        timestamp: expect.any(String),
        uptime: expect.any(Number)
      });
    });
  });

  describe('GET /api/', () => {
    it('devrait retourner les informations de l\'API', async () => {
      const response = await request(app).get('/api/');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: 'Social Media Management API',
        version: '1.0.0',
        supportedNetworks: expect.any(Array),
        endpoints: expect.any(Object)
      });
    });
  });

  describe('GET /api/status', () => {
    it('devrait retourner le statut des services', async () => {
      const response = await request(app).get('/api/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        status: 'healthy',
        services: expect.any(Array)
      });
    });
  });

  describe('Route non trouvée', () => {
    it('devrait retourner 404 pour une route inexistante', async () => {
      const response = await request(app).get('/route-inexistante');

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        error: 'Route non trouvée',
        path: '/route-inexistante'
      });
    });
  });
});