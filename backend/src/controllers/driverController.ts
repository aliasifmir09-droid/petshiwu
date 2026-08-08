import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order';
import DeliveryRun, { IDeliveryRun, IDeliveryRunStop } from '../models/DeliveryRun';
import { AuthRequest } from '../middleware/auth';
import { uploadDeliveryProof } from './deliveryController';

const DRIVER_STATUSES = ['ready', 'assigned', 'out_for_delivery', 'delivered', 'failed', 'cancelled'] as const;
type DriverStatus = typeof DRIVER_STATUSES[number];

const VALID_TRANSITIONS: Record<DriverStatus, DriverStatus[]> = {
  ready: ['out_for_delivery'],
  assigned: ['out_for_delivery'],
  out_for_delivery: ['delivered', 'failed'],
  delivered: [],
  failed: ['out_for_delivery'],
  cancelled: []
};

type AssignResult = { run: mongoose.Document & IDeliveryRun; stop: IDeliveryRunStop };

const findAssignedStopOr404 = async (req: AuthRequest, res: Response, orderId: string): Promise<AssignResult | undefined> => {
  const order = new mongoose.Types.ObjectId(orderId);
  const run = await DeliveryRun.findOne({
    assignedDriver: req.user!._id,
    'stops.order': order
  });
  if (!run) {
    res.status(404).json({ success: false, message: 'Stop not found in your assignments' });
    return undefined;
  }
  const stop = run.stops.find(stop => stop.order.toString() === orderId);
  if (!stop) {
    res.status(404).json({ success: false, message: 'Stop not found in your assignments' });
    return undefined;
  }
  return { run, stop };
};

export const getDriverMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const driver = await req.user!;
    res.json({
      success: true,
      data: {
        firstName: driver.firstName,
        lastName: driver.lastName,
        email: driver.email,
        phone: driver.phone,
        role: driver.role,
        passwordExpiresAt: driver.passwordExpiresAt
      }
    });
  } catch (error) { next(error); }
};

export const getTodayRuns = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const runs = await DeliveryRun.find({
      assignedDriver: req.user!._id,
      serviceDate: { $gte: todayStart, $lt: todayEnd }
    }).lean();

    res.json({ success: true, data: runs });
  } catch (error) { next(error); }
};

export const getDriverStop = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await findAssignedStopOr404(req, res, req.params.orderId);
    if (!result) return;

    const { run, stop } = result;
    const order = await Order.findById(stop.order)
      .select('orderNumber delivery items')
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      data: {
        runId: run._id,
        runName: run.name,
        runStatus: run.status,
        stopOrder: stop.stopOrder,
        orderId: String(order._id),
        orderNumber: order.orderNumber,
        deliveryStatus: stop.deliveryStatus,
        address: {
          street: order.delivery?.destination?.address || stop.address,
          city: stop.city,
          state: stop.state,
          zipCode: stop.zipCode
        },
        coordinates: stop.latitude != null && stop.longitude != null
          ? { latitude: stop.latitude, longitude: stop.longitude }
          : undefined,
        navigationUrl: order.delivery?.navigationUrl,
        items: order.items?.map((item: { name: string; quantity: number; variant?: { size?: string; weight?: string; sku?: string } }) => ({
          name: item.name,
          quantity: item.quantity,
          variant: item.variant ? { size: item.variant.size, weight: item.variant.weight, sku: item.variant.sku } : undefined
        })) || []
      }
    });
  } catch (error) { next(error); }
};

export const updateDriverStopStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!status || !DRIVER_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${DRIVER_STATUSES.join(', ')}` });
    }

    const result = await findAssignedStopOr404(req, res, req.params.orderId);
    if (!result) return;

    const { run, stop } = result;
    const current = stop.deliveryStatus as DriverStatus;
    const allowed = VALID_TRANSITIONS[current];

    if (!allowed || !allowed.includes(status as DriverStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${current}' to '${status}'. Allowed transitions: ${allowed?.join(', ') || 'none'}`
      });
    }

    // delivered status requires existing proof
    if (status === 'delivered') {
      const order = await Order.findById(stop.order).select('delivery').lean();
      const proof = (order?.delivery as Record<string, unknown>)?.proof;
      if (!proof || !(proof as Record<string, unknown>)?.photoUrl) {
        return res.status(400).json({
          success: false,
          message: 'Cannot mark as delivered without proof photo. Upload proof first.'
        });
      }
    }

    const updateResult = await DeliveryRun.updateOne(
      {
        _id: run._id,
        assignedDriver: req.user!._id,
        'stops.order': stop.order
      },
      { $set: { 'stops.$.deliveryStatus': status } }
    );

    if (updateResult.matchedCount !== 1) {
      return res.status(409).json({ success: false, message: 'Stop was modified before status update; retry' });
    }

    res.json({ success: true, data: { orderId: String(stop.order), deliveryStatus: status } });
  } catch (error) { next(error); }
};

export const uploadDriverProof = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await findAssignedStopOr404(req, res, req.params.orderId);
    if (!result) return;

    const { run, stop } = result;

    // verify not already delivered
    const order = await Order.findById(stop.order).select('delivery').lean();
    const current = (order?.delivery as Record<string, unknown>)?.status as string;
    if (current === 'delivered') {
      return res.status(400).json({ success: false, message: 'This order is already delivered' });
    }

    // delegate to the existing deliveryController's proof upload
    let delegatedError: unknown = undefined;
    let succeeded = false;

    const originalJson = res.json.bind(res);
    res.json = function (body: Record<string, unknown>) {
      if (body?.success) succeeded = true;
      return originalJson(body);
    };

    await uploadDeliveryProof(req, res, (error: unknown) => { delegatedError = error; });
    if (delegatedError) return next(delegatedError);

    if (succeeded) {
      const runUpdate = await DeliveryRun.updateOne(
        {
          _id: run._id,
          assignedDriver: req.user!._id,
          'stops.order': new mongoose.Types.ObjectId(req.params.orderId)
        },
        { $set: { 'stops.$.deliveryStatus': 'delivered' } }
      );
      if (runUpdate.matchedCount !== 1) {
        return next(new Error('Delivery proof saved but assigned run was changed before completion'));
      }
    }
  } catch (error) { next(error); }
};
