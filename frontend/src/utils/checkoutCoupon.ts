export type CheckoutCodeApiResult = {
  valid?: boolean;
  code?: string;
  discountAmount?: number;
  freeShipping?: boolean;
  message?: string;
};

export type AppliedCheckoutCode = {
  ok: boolean;
  code: string;
  discountAmount: number;
  waivesShipping: boolean;
  message: string;
};

export const checkoutCodeFromResponse = (
  raw: string,
  data: CheckoutCodeApiResult | undefined
): AppliedCheckoutCode => {
  if (!data?.valid) {
    return {
      ok: false,
      code: '',
      discountAmount: 0,
      waivesShipping: false,
      message: data?.message || 'That code could not be applied.',
    };
  }

  return {
    ok: true,
    code: String(data.code || raw).trim().toUpperCase(),
    discountAmount: Number(data.discountAmount) || 0,
    waivesShipping: Boolean(data.freeShipping),
    message: data.message || 'Code applied.',
  };
};

export const checkoutCodeFromError = (error: unknown): string => {
  const err = error as { response?: { data?: { message?: string } } };
  return err?.response?.data?.message || 'Could not apply coupon. Please try again.';
};
