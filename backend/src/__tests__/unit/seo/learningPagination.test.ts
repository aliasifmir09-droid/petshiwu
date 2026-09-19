import { planLearningPage } from '../../../seo/learningPagination';

describe('planLearningPage', () => {
  test('page 1 is only photo guides when static count fills the page', () => {
    const plan = planLearningPage(108, 4109, 1, 12);
    expect(plan).toMatchObject({
      total: 4217,
      staticStart: 0,
      staticLimit: 12,
      cmsSkip: 0,
      cmsLimit: 0,
    });
  });

  test('the page that finishes the photo guides also starts the CMS library', () => {
    const plan = planLearningPage(108, 4109, 9, 12);
    expect(plan).toMatchObject({
      staticStart: 96,
      staticLimit: 12,
      cmsSkip: 0,
      cmsLimit: 0,
    });

    const next = planLearningPage(108, 4109, 10, 12);
    expect(next).toMatchObject({
      staticStart: 0,
      staticLimit: 0,
      cmsSkip: 0,
      cmsLimit: 12,
    });
  });

  test('a short last static page fills the rest from CMS', () => {
    const plan = planLearningPage(10, 100, 1, 12);
    expect(plan).toMatchObject({
      total: 110,
      staticStart: 0,
      staticLimit: 10,
      cmsSkip: 0,
      cmsLimit: 2,
    });
  });

  test('later pages skip into the CMS library only', () => {
    const plan = planLearningPage(108, 4109, 20, 12);
    expect(plan).toMatchObject({
      staticLimit: 0,
      cmsSkip: 120,
      cmsLimit: 12,
    });
  });

  test('caps an oversized page size so the hub cannot load thousands at once', () => {
    const plan = planLearningPage(108, 4109, 1, 500);
    expect(plan.limit).toBe(48);
    expect(plan.staticLimit).toBe(48);
  });

  test('still paginates when CMS is empty', () => {
    const plan = planLearningPage(108, 0, 2, 12);
    expect(plan).toMatchObject({
      total: 108,
      staticStart: 12,
      staticLimit: 12,
      cmsLimit: 0,
    });
  });
});
