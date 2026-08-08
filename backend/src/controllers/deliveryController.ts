import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order';
import User from '../models/User';
import DeliveryRun from '../models/DeliveryRun';
import { AuthRequest } from '../middleware/auth';
import { downloadFromBunny } from '../utils/bunnyStorage';
import { sendDeliveryProofEmail } from '../utils/emailService';
import logger from '../utils/logger';
import { addressText, approximatePointForAddress, calculateDirectRoute, DELIVERY_ORIGIN, geocodeAddress, mapsNavigationUrl, optimizeRoute } from '../services/deliveryService';

const orderId = (req: Request) => String(req.params.id || '').trim();
const MAX_STOP_ORDER = 10000;

const isValidCoordinate = (latitude: unknown, longitude: unknown): boolean => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

const isValidStopOrder = (value: unknown): value is number => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= MAX_STOP_ORDER;
};

type DeliveryPointWithMeta = { latitude: number; longitude: number; formattedAddress?: string; placeId?: string; provider?: string };

const isValidDeliveryPoint = (point: any): boolean =>
  isValidCoordinate(point?.latitude, point?.longitude);

const hasImageSignature = (buffer: Buffer, mimeType: string): boolean => {
  if (mimeType === 'image/jpeg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === 'image/webp') return buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  return false;
};

const toPoint = (delivery: any): DeliveryPointWithMeta | null => delivery?.destination?.latitude !== undefined && delivery?.destination?.longitude !== undefined
  ? { latitude: Number(delivery.destination.latitude), longitude: Number(delivery.destination.longitude), formattedAddress: delivery.destination.formattedAddress, placeId: delivery.destination.placeId, provider: delivery.destination.provider }
  : null;

const ensureDelivery = async (order: any, suppliedPoint?: any) => {
  const destinationAddress = addressText(order.shippingAddress);
  const hasSuppliedCoordinates = suppliedPoint && (suppliedPoint.latitude !== undefined || suppliedPoint.longitude !== undefined);
  if (hasSuppliedCoordinates && !isValidCoordinate(suppliedPoint.latitude, suppliedPoint.longitude)) {
    throw new Error('Delivery coordinates must use latitude -90..90 and longitude -180..180');
  }
  let point = suppliedPoint && isValidDeliveryPoint(suppliedPoint)
      ? { latitude: Number(suppliedPoint.latitude), longitude: Number(suppliedPoint.longitude), provider: 'checkout' }
      : toPoint(order.delivery);
  if (!point) point = await geocodeAddress(destinationAddress);
  if (!point) point = approximatePointForAddress(order.shippingAddress);
  if (!point) throw new Error('This address could not be located yet. Add coordinates or configure Google routing.');
  if (!isValidCoordinate(point.latitude, point.longitude)) {
    throw new Error('Resolved delivery coordinates are outside geographic bounds');
  }
  const route = await calculateDirectRoute(DELIVERY_ORIGIN, point);
  if (!order.delivery) order.delivery = {} as any;
  order.delivery.origin = DELIVERY_ORIGIN;
  order.delivery.destination = {
    address: destinationAddress,
    formattedAddress: point.formattedAddress || destinationAddress,
    latitude: point.latitude,
    longitude: point.longitude,
    placeId: point.placeId,
    provider: point.provider
  };
  order.delivery.distanceMeters = route.distanceMeters;
  order.delivery.durationSeconds = route.durationSeconds;
  order.delivery.calculatedAt = new Date();
  order.delivery.routingProvider = point.provider === 'borough-estimate' ? 'local-estimate' : (process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.GOOGLE_MAPS_API_KEY ? 'google-routes' : 'local-estimate');
  order.delivery.navigationUrl = mapsNavigationUrl(DELIVERY_ORIGIN.address, [destinationAddress]);
  order.delivery.status = order.delivery.status || 'ready';
  return order;
};

const deliveryUpdateFields = (delivery: any): Record<string, unknown> => ({
  'delivery.origin': delivery.origin,
  'delivery.destination': delivery.destination,
  'delivery.distanceMeters': delivery.distanceMeters,
  'delivery.durationSeconds': delivery.durationSeconds,
  'delivery.calculatedAt': delivery.calculatedAt,
  'delivery.routingProvider': delivery.routingProvider,
  'delivery.navigationUrl': delivery.navigationUrl,
  'delivery.status': delivery.status,
  ...(delivery.runId !== undefined ? { 'delivery.runId': delivery.runId } : {}),
  ...(delivery.stopOrder !== undefined ? { 'delivery.stopOrder': delivery.stopOrder } : {}),
  ...(delivery.notes !== undefined ? { 'delivery.notes': delivery.notes } : {})
});

const persistDeliveryFields = async (orderId: mongoose.Types.ObjectId | string, delivery: any) => {
  return Order.findByIdAndUpdate(
    orderId,
    { $set: deliveryUpdateFields(delivery) },
    { new: true, runValidators: true, context: 'query' }
  );
};

export const prepareOrderDelivery = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(orderId(req))) return res.status(400).json({ success: false, message: 'Invalid order ID' });
    const order = await Order.findById(orderId(req));
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    await ensureDelivery(order, req.body?.destination);
    const updatedOrder = await persistDeliveryFields(order._id, order.delivery);
    if (!updatedOrder) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: updatedOrder.delivery });
  } catch (error) { next(error); }
};

export const updateDelivery = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(orderId(req))) return res.status(400).json({ success: false, message: 'Invalid order ID' });
    const order = await Order.findById(orderId(req));
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!order.delivery) await ensureDelivery(order);
    const allowed = ['ready', 'assigned', 'out_for_delivery', 'delivered', 'failed', 'cancelled'];
    if (req.body?.status !== undefined && !allowed.includes(String(req.body.status))) {
      return res.status(400).json({ success: false, message: 'Invalid delivery status' });
    }

    const requestedRunId = req.body?.runId !== undefined ? String(req.body.runId).trim() : undefined;
    const existingRunId = order.delivery?.runId ? String(order.delivery.runId) : undefined;
    const effectiveRunId = requestedRunId || existingRunId;
    let run: any = null;
    if (requestedRunId !== undefined || req.body?.stopOrder !== undefined) {
      if (!effectiveRunId || !mongoose.Types.ObjectId.isValid(effectiveRunId)) {
        return res.status(400).json({ success: false, message: 'A valid delivery run ID is required' });
      }
      run = await DeliveryRun.findById(effectiveRunId);
      if (!run) return res.status(404).json({ success: false, message: 'Delivery run not found' });
      if (!run.stops.some((stop: any) => String(stop.order) === orderId(req))) {
        return res.status(400).json({ success: false, message: 'Delivery run does not contain this order' });
      }
    }
    if (req.body?.stopOrder !== undefined) {
      if (!isValidStopOrder(req.body.stopOrder)) {
        return res.status(400).json({ success: false, message: `stopOrder must be an integer from 1 to ${MAX_STOP_ORDER}` });
      }
      if (run && Number(req.body.stopOrder) > run.stops.length) {
        return res.status(400).json({ success: false, message: 'stopOrder exceeds the delivery run stop count' });
      }
    }
    if (req.body?.status !== undefined) order.delivery!.status = req.body.status;
    if (req.body?.notes !== undefined) order.delivery!.notes = String(req.body.notes || '').trim();
    if (requestedRunId) order.delivery!.runId = requestedRunId as any;
    if (req.body?.stopOrder !== undefined) order.delivery!.stopOrder = Number(req.body.stopOrder);
    const updatedOrder = await persistDeliveryFields(order._id, order.delivery);
    if (!updatedOrder) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: updatedOrder.delivery });
  } catch (error) { next(error); }
};

export const createDeliveryRun = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rawIds = req.body?.orderIds;
    if (!Array.isArray(rawIds) || rawIds.length === 0 || !rawIds.every((id: unknown) => typeof id === 'string')) {
      return res.status(400).json({ success: false, message: 'Select at least one order' });
    }
    const ids = rawIds.map((id: string) => id.trim());
    if (ids.some(id => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ success: false, message: 'All order IDs must be valid' });
    }
    if (new Set(ids).size !== ids.length) {
      return res.status(400).json({ success: false, message: 'Duplicate orders are not allowed in a delivery run' });
    }
    const orders = await Order.find({ _id: { $in: ids } }).sort({ createdAt: 1 });
    if (orders.length !== ids.length) {
      const found = new Set(orders.map(order => String(order._id)));
      const missing = ids.filter(id => !found.has(id));
      return res.status(404).json({ success: false, message: `Order not found: ${missing.join(', ')}` });
    }
    const notFulfillable = orders.filter(order => order.paymentStatus !== 'paid' || !['pending', 'processing', 'shipped'].includes(order.orderStatus));
    if (notFulfillable.length) {
      return res.status(400).json({ success: false, message: 'Only paid, non-cancelled, non-delivered orders can be added to a delivery run' });
    }
    const stops: any[] = [];
    for (const order of orders) {
      await ensureDelivery(order);
      const updatedOrder = await persistDeliveryFields(order._id, order.delivery);
      if (!updatedOrder) return res.status(404).json({ success: false, message: `Order not found: ${order.orderNumber}` });
      const point = toPoint(updatedOrder.delivery);
      if (!point || !isValidCoordinate(point.latitude, point.longitude)) {
        return res.status(400).json({ success: false, message: `Order ${order.orderNumber} has invalid delivery coordinates` });
      }
      stops.push({
        order: order._id,
        orderNumber: order.orderNumber,
        stopOrder: stops.length + 1,
        address: order.shippingAddress.street,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        zipCode: order.shippingAddress.zipCode,
        latitude: point.latitude,
        longitude: point.longitude,
        distanceMeters: order.delivery?.distanceMeters,
        durationSeconds: order.delivery?.durationSeconds,
        deliveryStatus: order.delivery?.status || 'ready'
      });
    }
    const serviceDate = req.body?.serviceDate ? new Date(req.body.serviceDate) : new Date();
    if (Number.isNaN(serviceDate.getTime())) return res.status(400).json({ success: false, message: 'Invalid service date' });
    if (!stops.length || stops.length !== orders.length) return res.status(400).json({ success: false, message: 'Every selected order must have a valid delivery point' });
    const run = await DeliveryRun.create({
      name: String(req.body?.name || `Jackson Heights run · ${new Date().toLocaleDateString('en-US')}`).trim().slice(0, 120),
      serviceDate,
      origin: DELIVERY_ORIGIN,
      stops,
      status: 'draft',
      createdBy: req.user?._id
    });
    await Order.updateMany({ _id: { $in: orders.map(order => order._id) } }, { $set: { 'delivery.runId': run._id, 'delivery.status': 'assigned' } });
    res.status(201).json({ success: true, data: run });
  } catch (error) { next(error); }
};

export const listDeliveryRuns = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await DeliveryRun.find().sort({ serviceDate: -1, createdAt: -1 }).limit(50).lean() }); }
  catch (error) { next(error); }
};

export const getDeliveryRun = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.runId))) return res.status(400).json({ success: false, message: 'Invalid run ID' });
    const run = await DeliveryRun.findById(req.params.runId).lean();
    if (!run) return res.status(404).json({ success: false, message: 'Delivery run not found' });
    const orders = await Order.find({ _id: { $in: run.stops.map(stop => stop.order) } }).lean();
    res.json({ success: true, data: { ...run, orders } });
  } catch (error) { next(error); }
};

export const optimizeDeliveryRun = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.runId))) return res.status(400).json({ success: false, message: 'Invalid run ID' });
    const run = await DeliveryRun.findById(req.params.runId);
    if (!run) return res.status(404).json({ success: false, message: 'Delivery run not found' });
    const points = run.stops.map(stop => ({ latitude: stop.latitude || DELIVERY_ORIGIN.latitude, longitude: stop.longitude || DELIVERY_ORIGIN.longitude }));
    const result = await optimizeRoute(DELIVERY_ORIGIN, points);
    run.stops = result.order.map((originalIndex: number, index: number) => ({ ...run.stops[originalIndex], stopOrder: index + 1 } as any));
    run.totalDistanceMeters = result.totalDistanceMeters;
    run.totalDurationSeconds = result.totalDurationSeconds;
    run.optimizedBy = result.provider;
    run.navigationUrl = mapsNavigationUrl(run.origin.address, run.stops.map(stop => `${stop.address}, ${stop.city}, ${stop.state} ${stop.zipCode}`));
    run.status = 'ready';
    await run.save();
    await Promise.all(run.stops.map(stop => Order.updateOne({ _id: stop.order }, { $set: { 'delivery.runId': run._id, 'delivery.stopOrder': stop.stopOrder, 'delivery.status': 'assigned' } })));
    res.json({ success: true, data: run });
  } catch (error) { next(error); }
};

export const uploadDeliveryProof = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = orderId(req);
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid order ID' });
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const file = req.file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ success: false, message: 'Please upload a delivery photo' });

    const detectedMime = file.mimetype.toLowerCase();
    if (!hasImageSignature(file.buffer, detectedMime)) {
      return res.status(400).json({ success: false, message: 'Delivery proof image content could not be verified' });
    }

    const existingDelivery = order.delivery || { origin: DELIVERY_ORIGIN };
    order.delivery = {
      ...existingDelivery,
      proof: {
        photoData: file.buffer,
        storageKey: String(order._id),
        storageProvider: 'mongodb',
        mimeType: detectedMime,
        uploadedAt: new Date(),
        uploadedBy: req.user?._id,
        recipientName: String(req.body?.recipientName || '').trim() || undefined,
        handoffMethod: String(req.body?.handoffMethod || 'handed_to_customer'),
        notes: String(req.body?.notes || '').trim() || undefined
      },
      status: 'delivered'
    } as any;
    order.isDelivered = true;
    order.deliveredAt = new Date();
    order.orderStatus = 'delivered';
    await order.save();

    const proof = order.delivery?.proof;
    const notification = order.delivery?.proofNotification;
    const staleQueued = notification?.status === 'queued'
      && notification.queuedAt
      && Date.now() - new Date(notification.queuedAt).getTime() > 15 * 60 * 1000;
    const reservation = await Order.findOneAndUpdate(
      {
        _id: order._id,
        $or: [
          { 'delivery.proofNotification.status': { $exists: false } },
          { 'delivery.proofNotification.status': 'failed' },
          ...(staleQueued ? [{ 'delivery.proofNotification.status': 'queued' }] : [])
        ]
      },
      {
        $set: {
          'delivery.proofNotification.status': 'queued',
          'delivery.proofNotification.queuedAt': new Date(),
          'delivery.proofNotification.lastError': undefined
        },
        $inc: { 'delivery.proofNotification.attempts': 1 }
      },
      { new: true }
    );

    if (reservation && proof?.photoData && Buffer.isBuffer(proof.photoData)) {
      try {
        const account = order.user ? await User.findById(order.user).select('email firstName').lean() : null;
        const customerEmail = String(account?.email || order.guestEmail || '').trim();
        const firstName = String(account?.firstName || order.shippingAddress?.firstName || 'Customer').trim();

        if (!customerEmail) {
          await Order.updateOne(
            { _id: order._id },
            {
              $set: {
                'delivery.proofNotification.status': 'skipped_no_email',
                'delivery.proofNotification.lastError': 'No customer email was available'
              }
            }
          );
        } else {
          const emailResult = await sendDeliveryProofEmail(
            customerEmail,
            firstName,
            order.orderNumber,
            {
              deliveredAt: order.deliveredAt || new Date(),
              handoffMethod: proof.handoffMethod,
              recipientName: proof.recipientName,
              notes: proof.notes,
              photoData: proof.photoData,
              mimeType: proof.mimeType || detectedMime
            }
          );
          await Order.updateOne(
            { _id: order._id },
            {
              $set: {
                'delivery.proofNotification.status': 'sent',
                'delivery.proofNotification.sentAt': new Date(),
                'delivery.proofNotification.messageId': emailResult.messageId,
                'delivery.proofNotification.lastError': undefined
              }
            }
          );
        }
      } catch (notificationError: any) {
        logger.error(`Delivery proof email failed for order #${order.orderNumber}:`, notificationError?.message || notificationError);
        await Order.updateOne(
          { _id: order._id },
          {
            $set: {
              'delivery.proofNotification.status': 'failed',
              'delivery.proofNotification.lastError': String(notificationError?.message || notificationError).slice(0, 500)
            }
          }
        );
      }
    }

    res.json({ success: true, data: proof ? {
      uploadedAt: proof.uploadedAt,
      uploadedBy: proof.uploadedBy,
      recipientName: proof.recipientName,
      handoffMethod: proof.handoffMethod,
      notes: proof.notes
    } : undefined });
  } catch (error) { next(error); }
};


export const getDeliveryProof = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = orderId(req);
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid order ID' });
  const order = await Order.findById(id).select('+delivery.proof.photoUrl +delivery.proof.photoData +delivery.proof.storageKey +delivery.proof.storageProvider +delivery.proof.mimeType');
  const proof = order?.delivery?.proof;
  if (!order || !proof) return res.status(404).json({ success: false, message: 'Delivery proof not found' });
  if (proof.photoData && Buffer.isBuffer(proof.photoData)) {
    res.setHeader('Content-Type', proof.mimeType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, no-store');
    return res.send(proof.photoData);
  }

  const storageKey = proof.storageKey || proof.photoUrl;
  if (!storageKey) return res.status(404).json({ success: false, message: 'Delivery proof file is unavailable' });

  if (proof.storageProvider === 'bunny' || storageKey.startsWith('deliveries/')) {
    const file = await downloadFromBunny(storageKey);
    res.setHeader('Content-Type', proof.mimeType || file.contentType);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.send(file.buffer);
  }

  const filename = path.basename(storageKey);
  const storageDir = storageKey.startsWith('/uploads/') ? path.join(__dirname, '../../uploads') : path.join(__dirname, '../../private-deliveries');
  const filePath = path.join(storageDir, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'Delivery proof file is unavailable' });
  res.setHeader('Content-Type', proof.mimeType || 'application/octet-stream');
  res.setHeader('Cache-Control', 'private, no-store');
  return res.sendFile(filePath);
} catch (error) { next(error); }
};
