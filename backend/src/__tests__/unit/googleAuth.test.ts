import { namesFromGoogleProfile } from '../../services/googleAuth';

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
