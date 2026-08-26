import { describe, expect, test } from 'vitest';
import { GBP_DESCRIPTION, TONIGHT, TONIGHT_FAQ, TONIGHT_STEPS, withTonightFaq } from '../tonightDelivery';

describe('tonight delivery promise', () => {
  test('cutoff and door time match the live shop rules', () => {
    expect(TONIGHT.weekdayCutoff).toBe('3 PM');
    expect(TONIGHT.weekendCutoff).toBe('1 PM');
    expect(TONIGHT.deliverBy).toBe('11 PM');
    expect(TONIGHT.freeOver).toBe(49);
    expect(TONIGHT.promise).toMatch(/no autoship/i);
  });

  test('Google Business description fits the 750-character limit', () => {
    expect(GBP_DESCRIPTION.length).toBeGreaterThan(200);
    expect(GBP_DESCRIPTION.length).toBeLessThanOrEqual(750);
    expect(GBP_DESCRIPTION).toMatch(/not a walk-in store/i);
    expect(GBP_DESCRIPTION).toMatch(/3 PM/);
    expect(GBP_DESCRIPTION).toMatch(/1 PM/);
    expect(GBP_DESCRIPTION).toMatch(/11 PM/);
    expect(GBP_DESCRIPTION).toMatch(/No autoship/);
    expect(GBP_DESCRIPTION).toMatch(/Petshiwu/);
    expect(GBP_DESCRIPTION).not.toMatch(/PetShiwu/);
  });

  test('how-it-works has four clear steps', () => {
    expect(TONIGHT_STEPS).toHaveLength(4);
    expect(TONIGHT_STEPS[3].text).toMatch(/11 PM/);
  });

  test('landing pages get a same-day FAQ when they do not already have one', () => {
    const withFaq = withTonightFaq([{ question: 'What brands?', answer: 'Purina and more.' }]);
    expect(withFaq[0]).toEqual(TONIGHT_FAQ);
    const already = withTonightFaq([TONIGHT_FAQ]);
    expect(already).toHaveLength(1);
  });
});
