import { render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import GoogleCustomerReviewsOptIn from '../GoogleCustomerReviewsOptIn';
import { GCR_PLATFORM_SCRIPT_ID, GCR_PLATFORM_SRC } from '@/utils/googleCustomerReviews';

describe('GoogleCustomerReviewsOptIn', () => {
  test('loads the Google survey script with merchant order details', () => {
    const renderSurvey = vi.fn();
    window.gapi = {
      load: (_module: string, callback: () => void) => {
        window.gapi!.surveyoptin = { render: renderSurvey };
        callback();
      },
    };

    render(
      <GoogleCustomerReviewsOptIn
        enabled
        email="guest@example.com"
        order={{
          orderNumber: 'ORD-123',
          createdAt: '2026-08-13T14:00:00.000Z',
          shippingAddress: { zipCode: '11372', country: 'USA', state: 'NY' },
        }}
      />
    );

    expect(renderSurvey).toHaveBeenCalledWith(expect.objectContaining({
      merchant_id: 5791232179,
      order_id: 'ORD-123',
      email: 'guest@example.com',
      delivery_country: 'US',
      estimated_delivery_date: '2026-08-13',
      opt_in_style: 'CENTER_DIALOG',
    }));
    expect(window.___gcfg).toEqual({ lang: 'en-US' });
    expect(typeof window.renderOptIn).toBe('function');
  });

  test('does not load Google when this is not a fresh confirmation', () => {
    document.getElementById(GCR_PLATFORM_SCRIPT_ID)?.remove();
    delete window.gapi;
    render(
      <GoogleCustomerReviewsOptIn
        enabled={false}
        email="guest@example.com"
        order={{ orderNumber: 'ORD-123' }}
      />
    );
    expect(document.getElementById(GCR_PLATFORM_SCRIPT_ID)).toBeNull();
    expect(document.querySelector(`script[src="${GCR_PLATFORM_SRC}"]`)).toBeNull();
  });
});
