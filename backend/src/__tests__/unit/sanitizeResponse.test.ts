import mongoose from 'mongoose';
import { sanitizeApiPayload } from '../../middleware/sanitizeResponse';

describe('sanitizeApiPayload keeps checkout reuse fields', () => {
  it('keeps Mongo ObjectIds as hex strings so a saved card can be charged', () => {
    const id = new mongoose.Types.ObjectId();
    const sanitized = sanitizeApiPayload({
      _id: id,
      last4: '4242',
      brand: 'visa',
    }) as { _id: string; last4: string };

    expect(sanitized._id).toBe(String(id));
    expect(sanitized.last4).toBe('4242');
  });

  it('flattens mongoose-style address subdocs so street and zip survive', () => {
    const sanitized = sanitizeApiPayload({
      data: [{
        toObject() {
          return {
            street: '37-68 74th St',
            city: 'Queens',
            state: 'NY',
            zipCode: '11372',
            country: 'USA',
            isDefault: true,
          };
        },
      }],
    }) as { data: Array<{ street: string; zipCode: string }> };

    expect(sanitized.data[0].street).toBe('37-68 74th St');
    expect(sanitized.data[0].zipCode).toBe('11372');
  });
});
