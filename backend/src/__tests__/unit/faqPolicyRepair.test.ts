import { planFaqRepair } from '../../services/faqPolicyRepair';

describe('FAQ policy repair', () => {
  test('fixes the PITSHIWU spelling and 14-day return copy', () => {
    const spelling = planFaqRepair('Are PITSHIWU products safe for my pets?', 'Absolutely!');
    expect(spelling?.question).toMatch(/Petshiwu/);
    expect(spelling?.question).not.toMatch(/PITSHIWU/);

    const returns = planFaqRepair(
      'What is your return and refund policy?',
      'You can return it within 14 days of delivery.'
    );
    expect(returns?.answer).toMatch(/365 days/);
    expect(returns?.answer).not.toMatch(/14 days/);
  });

  test('cancel window is two hours, not never', () => {
    const plan = planFaqRepair(
      'Can I change or cancel my order after placing it?',
      'Once submitted it cannot be canceled.'
    );
    expect(plan?.answer).toMatch(/2 hours/);
  });
});
