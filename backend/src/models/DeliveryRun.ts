import mongoose, { Document, Schema } from 'mongoose';

export type DeliveryRunStatus = 'draft' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled';

export interface IDeliveryRunStop {
  order: mongoose.Types.ObjectId;
  orderNumber: string;
  stopOrder: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
  durationSeconds?: number;
  deliveryStatus: string;
}

export interface IDeliveryRun extends Document {
  name: string;
  serviceDate: Date;
  status: DeliveryRunStatus;
  origin: {
    label: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  stops: IDeliveryRunStop[];
  totalDistanceMeters?: number;
  totalDurationSeconds?: number;
  optimizedBy?: string;
  navigationUrl?: string;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const stopSchema = new Schema<IDeliveryRunStop>({
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  orderNumber: { type: String, required: true },
  stopOrder: { type: Number, required: true, min: 1 },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  latitude: Number,
  longitude: Number,
  distanceMeters: Number,
  durationSeconds: Number,
  deliveryStatus: { type: String, default: 'ready' }
}, { _id: false });

const deliveryRunSchema = new Schema<IDeliveryRun>({
  name: { type: String, required: true, trim: true },
  serviceDate: { type: Date, required: true, default: Date.now },
  status: { type: String, enum: ['draft', 'ready', 'out_for_delivery', 'completed', 'cancelled'], default: 'draft' },
  origin: {
    label: { type: String, required: true, default: 'Jackson Heights base' },
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  stops: { type: [stopSchema], default: [] },
  totalDistanceMeters: Number,
  totalDurationSeconds: Number,
  optimizedBy: String,
  navigationUrl: String,
  notes: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

deliveryRunSchema.index({ serviceDate: -1, status: 1 });
deliveryRunSchema.index({ 'stops.order': 1 });

export default mongoose.model<IDeliveryRun>('DeliveryRun', deliveryRunSchema);
