import { Navigate, useParams } from 'react-router-dom';
import NotFound from '../NotFound';
import { NEIGHBORHOOD_PAGE_MAP, NeighborhoodPageConfig, neighborhoodLandingPath } from '@/data/neighborhoodPages';

interface Props {
  config: NeighborhoodPageConfig;
}

/**
 * Old neighborhood×category URLs were 1,400 near-duplicate pages.
 * Send people (and Google) to the real city landing instead of serving copies.
 */
const NeighborhoodCategoryPage = ({ config }: Props) => (
  <Navigate to={neighborhoodLandingPath(config.categorySlug)} replace />
);

/**
 * Router wrapper — used when route param is dynamic.
 * Looks up the slug in the page map and renders or 404s.
 */
export const NeighborhoodCategoryRouter = () => {
  const { neighborhoodPageSlug } = useParams<{ neighborhoodPageSlug: string }>();
  const config = neighborhoodPageSlug ? NEIGHBORHOOD_PAGE_MAP.get(neighborhoodPageSlug) : undefined;
  if (!config) return <NotFound />;
  return <NeighborhoodCategoryPage config={config} />;
};

export default NeighborhoodCategoryPage;
