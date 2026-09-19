/** Plan one Learning hub page: photo guides first, then the CMS library. */

export const LEARNING_PAGE_SIZE = 12;
export const LEARNING_PAGE_SIZE_MAX = 48;

export type LearningPagePlan = {
  page: number;
  limit: number;
  total: number;
  staticStart: number;
  staticLimit: number;
  cmsSkip: number;
  cmsLimit: number;
};

export const planLearningPage = (
  staticCount: number,
  cmsCount: number,
  page: number,
  limit: number
): LearningPagePlan => {
  const safePage = Math.max(1, Math.floor(Number(page) || 1));
  const safeLimit = Math.min(
    LEARNING_PAGE_SIZE_MAX,
    Math.max(1, Math.floor(Number(limit) || LEARNING_PAGE_SIZE))
  );
  const staticN = Math.max(0, Math.floor(Number(staticCount) || 0));
  const cmsN = Math.max(0, Math.floor(Number(cmsCount) || 0));
  const skip = (safePage - 1) * safeLimit;

  if (skip >= staticN) {
    return {
      page: safePage,
      limit: safeLimit,
      total: staticN + cmsN,
      staticStart: 0,
      staticLimit: 0,
      cmsSkip: skip - staticN,
      cmsLimit: safeLimit,
    };
  }

  const staticLimit = Math.min(safeLimit, staticN - skip);
  return {
    page: safePage,
    limit: safeLimit,
    total: staticN + cmsN,
    staticStart: skip,
    staticLimit,
    cmsSkip: 0,
    cmsLimit: safeLimit - staticLimit,
  };
};
