import { useParams } from 'react-router-dom';
import SEOLandingPage from '../SEOLandingPage';
import NotFound from '../NotFound';
import { NEIGHBORHOOD_PAGE_MAP, NeighborhoodPageConfig } from '@/data/neighborhoodPages';

interface Props {
  config: NeighborhoodPageConfig;
}

/**
 * Programmatic neighborhood × category SEO page.
 * Used for 200 pages: /[category]-[neighborhood]-[borough]
 * e.g. /dog-food-delivery-flushing-queens, /cat-food-delivery-williamsburg-brooklyn
 */
const NeighborhoodCategoryPage = ({ config }: Props) => (
  <SEOLandingPage
    keyword={config.keyword}
    title={config.title}
    description={config.description}
    h1={config.h1}
    introContent={config.introContent}
    problemPoints={config.problemPoints}
    solutionPoints={config.solutionPoints}
    faqItems={config.faqItems}
    searchTerms={config.searchTerms}
    petType={config.petType}
  />
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
