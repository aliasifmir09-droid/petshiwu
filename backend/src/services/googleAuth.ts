import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User, { IUser } from '../models/User';
import { attachGuestOrdersToUser, normalizeAccountEmail } from '../utils/claimGuestOrders';

export type GoogleProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  givenName?: string;
  familyName?: string;
  displayName?: string;
};

const lettersOnly = (value: string) => value.replace(/[^\p{L}\s'-]/gu, ' ').replace(/\s+/g, ' ').trim();

export const namesFromGoogleProfile = (profile: Pick<GoogleProfile, 'givenName' | 'familyName' | 'displayName' | 'email'>) => {
  const given = lettersOnly(profile.givenName || '');
  const family = lettersOnly(profile.familyName || '');
  if (given && family) return { firstName: given.slice(0, 50), lastName: family.slice(0, 50) };

  const parts = lettersOnly(profile.displayName || '').split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return { firstName: parts[0].slice(0, 50), lastName: parts.slice(1).join(' ').slice(0, 50) };
  }
  if (parts[0]) return { firstName: parts[0].slice(0, 50), lastName: 'Parent' };

  const emailName = lettersOnly((profile.email || '').split('@')[0] || '');
  return {
    firstName: (emailName || 'Pet').slice(0, 50),
    lastName: 'Parent',
  };
};

export const getGoogleClientId = () =>
  String(process.env.GOOGLE_CLIENT_ID || '').trim();

export const verifyGoogleIdToken = async (idToken: string): Promise<GoogleProfile> => {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error('Google login is not configured. Set GOOGLE_CLIENT_ID.');
  }
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Google credential is required.');
  }

  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new Error('Google did not return a verified email.');
  }
  if (payload.email_verified !== true) {
    throw new Error('Google email is not verified.');
  }

  return {
    sub: payload.sub,
    email: payload.email,
    emailVerified: true,
    givenName: payload.given_name,
    familyName: payload.family_name,
    displayName: payload.name,
  };
};

export const upsertGoogleCustomer = async (profile: GoogleProfile): Promise<IUser> => {
  const email = normalizeAccountEmail(profile.email);
  const googleId = String(profile.sub || '').trim();
  if (!email || !googleId) {
    throw new Error('Google did not return a verified email.');
  }
  if (!profile.emailVerified) {
    throw new Error('Google email is not verified.');
  }

  let user = await User.findOne({ googleId });
  if (!user) {
    user = await User.findOne({ email });
  }

  if (user) {
    if (user.googleId && user.googleId !== googleId) {
      throw new Error('This email is already linked to a different Google account.');
    }
    if (!user.isActive) {
      throw new Error('This account is disabled.');
    }
    user.googleId = googleId;
    user.emailVerified = true;
    await user.save({ validateBeforeSave: false });
    await attachGuestOrdersToUser(user._id, email);
    return user;
  }

  const names = namesFromGoogleProfile({ ...profile, email });
  const tempPassword = `Ggl${crypto.randomBytes(12).toString('hex')}Aa1`;
  user = await User.create({
    firstName: names.firstName,
    lastName: names.lastName,
    email,
    password: tempPassword,
    googleId,
    emailVerified: true,
    role: 'customer',
  });
  await attachGuestOrdersToUser(user._id, email);
  return user;
};
