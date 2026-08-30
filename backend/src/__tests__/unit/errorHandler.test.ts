import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { errorHandler } from '../../middleware/errorHandler';
import { ValidationError } from '../../utils/errors';

const mockRes = () => {
  const res = {
    statusCode: 0,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    }
  };
  return res as unknown as Response & { statusCode: number; body: { success: boolean; message: string } };
};

describe('errorHandler validation mapping', () => {
  const req = { originalUrl: '/api/orders/1/status', method: 'PUT', get: () => '', ip: '127.0.0.1' } as unknown as Request;
  const next = (() => undefined) as NextFunction;

  it('returns the mapped mongoose validation message instead of leaking Error.message only', () => {
    const err = new mongoose.Error.ValidationError();
    err.addError('delivery.proof.handoffMethod', new mongoose.Error.ValidatorError({
      message: 'Path `handoffMethod` is required.',
      path: 'delivery.proof.handoffMethod'
    }));
    const res = mockRes();
    errorHandler(err, req, res, next);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('handoffMethod');
  });

  it('keeps application ValidationError messages intact', () => {
    const res = mockRes();
    errorHandler(new ValidationError('Refund amount must be greater than 0'), req, res, next);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Refund amount must be greater than 0');
  });
});
