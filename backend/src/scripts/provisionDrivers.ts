import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';

dotenv.config();

type DriverInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
};

const readDriver = (index: 1 | 2): DriverInput | null => {
  const email = String(process.env[`DRIVER_${index}_EMAIL`] || '').trim().toLowerCase();
  const password = String(process.env[`DRIVER_${index}_PASSWORD`] || '');
  if (!email && !password) return null;
  if (!email || password.length < 12) {
    throw new Error(`DRIVER_${index}_EMAIL and DRIVER_${index}_PASSWORD are required; password must be at least 12 characters`);
  }
  return {
    firstName: String(process.env[`DRIVER_${index}_FIRST_NAME`] || `Driver ${index}`).trim(),
    lastName: String(process.env[`DRIVER_${index}_LAST_NAME`] || '').trim(),
    email,
    password,
    phone: String(process.env[`DRIVER_${index}_PHONE`] || '').trim() || undefined
  };
};

const main = async () => {
  if (process.env.ALLOW_DRIVER_PROVISIONING !== 'true') {
    throw new Error('Refusing to provision drivers. Set ALLOW_DRIVER_PROVISIONING=true explicitly.');
  }
  if (process.env.NODE_ENV === 'production' && process.env.CONFIRM_PRODUCTION_DRIVER_PROVISIONING !== 'YES') {
    throw new Error('Production provisioning requires CONFIRM_PRODUCTION_DRIVER_PROVISIONING=YES.');
  }
  const inputs = [readDriver(1), readDriver(2)].filter(Boolean) as DriverInput[];
  if (inputs.length !== 2) throw new Error('This first release requires exactly two driver entries.');
  if (new Set(inputs.map(driver => driver.email)).size !== inputs.length) throw new Error('Driver emails must be unique.');

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required.');
  await mongoose.connect(uri);

  try {
    for (const input of inputs) {
      const existing = await User.findOne({ email: input.email });
      if (existing && existing.role !== 'driver') throw new Error(`${input.email} already belongs to a non-driver account.`);
      if (existing) {
        existing.firstName = input.firstName;
        existing.lastName = input.lastName;
        existing.phone = input.phone;
        existing.isActive = true;
        existing.password = input.password;
        existing.role = 'driver';
        existing.permissions = {
          canManageProducts: false,
          canManageOrders: false,
          canManageCustomers: false,
          canManageCategories: false,
          canViewAnalytics: false,
          canManageUsers: false,
          canManageSettings: false,
          canManageDelivery: false
        };
        await existing.save();
        console.log(`Updated driver ${input.email}`);
      } else {
        await User.create({
          ...input,
          role: 'driver',
          isActive: true,
          emailVerified: true,
          permissions: {
            canManageProducts: false,
            canManageOrders: false,
            canManageCustomers: false,
            canManageCategories: false,
            canViewAnalytics: false,
            canManageUsers: false,
            canManageSettings: false,
            canManageDelivery: false
          }
        });
        console.log(`Created driver ${input.email}`);
      }
    }
  } finally {
    await mongoose.disconnect();
  }
};

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
