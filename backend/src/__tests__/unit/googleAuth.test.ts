import { namesFromGoogleProfile } from '../../services/googleAuth';
import { getGoogleClientId } from '../../utils/googleClientId';

describe('Google profile names', () => {
  it('uses given and family names', () => {
    expect(namesFromGoogleProfile({
      givenName: 'Asif',
      familyName: 'Ali',
      email: 'asif@gmail.com',
    })).toEqual({ firstName: 'Asif', lastName: 'Ali' });
  });

  it('splits a display name when given name is missing', () => {
    expect(namesFromGoogleProfile({
      displayName: 'Asif Ali',
      email: 'asif@gmail.com',
    })).toEqual({ firstName: 'Asif', lastName: 'Ali' });
  });

  it('falls back to the email local part', () => {
    expect(namesFromGoogleProfile({
      email: 'dubaiteamss@gmail.com',
    })).toEqual({ firstName: 'dubaiteamss', lastName: 'Parent' });
  });
});

describe('Google client id', () => {
  const originalGoogle = process.env.GOOGLE_CLIENT_ID;
  const originalVite = process.env.VITE_GOOGLE_CLIENT_ID;

  afterEach(() => {
    if (originalGoogle === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = originalGoogle;
    if (originalVite === undefined) delete process.env.VITE_GOOGLE_CLIENT_ID;
    else process.env.VITE_GOOGLE_CLIENT_ID = originalVite;
  });

  it('uses GOOGLE_CLIENT_ID when both are set', () => {
    process.env.GOOGLE_CLIENT_ID = 'runtime.apps.googleusercontent.com';
    process.env.VITE_GOOGLE_CLIENT_ID = 'build.apps.googleusercontent.com';
    expect(getGoogleClientId()).toBe('runtime.apps.googleusercontent.com');
  });

  it('falls back to VITE_GOOGLE_CLIENT_ID on the same Render service', () => {
    delete process.env.GOOGLE_CLIENT_ID;
    process.env.VITE_GOOGLE_CLIENT_ID = 'build.apps.googleusercontent.com';
    expect(getGoogleClientId()).toBe('build.apps.googleusercontent.com');
  });
});
