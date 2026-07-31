import { useEffect } from 'react';

interface AdSenseProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Google AdSense ad unit.
 * Auto-loads ads via adsbygoogle.js (already in index.html).
 * Each unit is registered once via window.adsbygoogle.push.
 */
const AdSense = ({ slot, format = 'auto', responsive = true, style, className }: AdSenseProps) => {
  useEffect(() => {
    try {
      // Push ad to adsbygoogle queue — registered once per slot
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      // Silently ignore — ad-blocker or third-party script issue
    }
  }, []);

  return (
    <div className={`adsense-container my-6 ${className || ''}`} style={{ minHeight: 100, ...style }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center' }}
        data-ad-client="ca-pub-8262868175443135"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
};

export default AdSense;