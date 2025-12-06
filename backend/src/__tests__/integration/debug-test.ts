import request from 'supertest';
import app from '../helpers/testApp';

describe('Debug Test', () => {
  it('should test basic endpoint', async () => {
    try {
      console.log('Making request to /api/users/me/permissions...');
      const response = await request(app)
        .get('/api/users/me/permissions');
      
      console.log('Response received');
      console.log('Status:', response.status);
      console.log('Body:', JSON.stringify(response.body, null, 2));
      console.log('Headers:', JSON.stringify(response.headers, null, 2));
      
      expect(response).toBeDefined();
      expect(response.status).toBe(401);
    } catch (error: any) {
      console.error('CAUGHT ERROR:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  });
});

