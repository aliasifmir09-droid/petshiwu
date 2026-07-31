import { useEffect } from 'react';

interface StickySidebarAdProps {
  slot: string;
}

/**
 * Sticky sidebar AdSense ad.
 * Stays visible as the user scrolls through the article.
 * Higher CTR than in-content ads because it's always in view.
 */
const StickySidebarAd = ({ slot }: StickySidebarAdProps) => {
  useEffect(() => {
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      // Silently ignore — ad-blocker or third-party script issue
    }
  }, []);

  return (
    <div className="sticky top-8 hidden lg:block">
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 text-center">Advertisement</p>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '300px', height: '250px' }}
          data-ad-client="ca-pub-8262868175443135"
          data-ad-slot={slot}
          data-ad-format="rectangle"
        />
      </div>
    </div>
  );
};

export default StickySidebarAd;