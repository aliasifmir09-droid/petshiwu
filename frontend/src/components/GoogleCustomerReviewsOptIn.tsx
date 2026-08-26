import { useEffect } from 'react';
import {
  GCR_LANGUAGE,
  GCR_PLATFORM_SCRIPT_ID,
  GCR_PLATFORM_SRC,
  GoogleReviewOrder,
  buildSurveyOptInConfig,
  resolveReviewEmail,
} from '@/utils/googleCustomerReviews';

type GoogleCustomerReviewsOptInProps = {
  enabled: boolean;
  order?: GoogleReviewOrder | null;
  email?: string;
  accountEmail?: string;
};

const GoogleCustomerReviewsOptIn = ({
  enabled,
  order,
  email,
  accountEmail,
}: GoogleCustomerReviewsOptInProps) => {
  useEffect(() => {
    if (!enabled || !order) return;

    const resolvedEmail = resolveReviewEmail(order, {
      explicitEmail: email,
      accountEmail,
    });
    const config = buildSurveyOptInConfig(order, resolvedEmail);
    if (!config) return;

    const render = () => {
      if (!window.gapi?.load) return;
      window.gapi.load('surveyoptin', () => {
        window.gapi?.surveyoptin?.render(config);
      });
    };

    window.___gcfg = { lang: GCR_LANGUAGE };
    window.renderOptIn = render;

    if (window.gapi?.load) {
      render();
      return;
    }

    const existing = document.getElementById(GCR_PLATFORM_SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', render, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = GCR_PLATFORM_SCRIPT_ID;
    script.src = GCR_PLATFORM_SRC;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, [enabled, order, email, accountEmail]);

  return null;
};

export default GoogleCustomerReviewsOptIn;
