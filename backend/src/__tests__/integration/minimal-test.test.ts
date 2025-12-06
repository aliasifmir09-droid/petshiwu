import request from 'supertest';
import app from '../helpers/testApp';

describe('Minimal Test', () => {
  it('should make a simple request', async () => {
    console.log('Making request...');
    const response = await request(app)
      .get('/api/users/me/permissions');
    
    console.log('Response received');
    console.log('Status:', response.status);
    console.log('Body:', JSON.stringify(response.body, null, 2));
    
    expect(response).toBeDefined();
    expect(response.status).toBe(401);
  });
});

