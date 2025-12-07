import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/products';
import { Facebook, Twitter, Mail, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Product } from '@/types';

interface ProductShareMenuProps {
  product: Product;
  onClose: () => void;
}

const ProductShareMenu = ({ product, onClose }: ProductShareMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: shareLinks } = useQuery({
    queryKey: ['productShareLinks', product._id],
    queryFn: () => productService.getProductShareLinks(product._id?.toString() || ''),
    enabled: !!product._id
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast('Link copied to clipboard!', 'success');
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 2000);
    } catch (error) {
      showToast('Failed to copy link', 'error');
    }
  };

  const shareLinksData = shareLinks || {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(product.name)}`,
    email: `mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(window.location.href)}`,
    link: window.location.href
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 min-w-[200px]"
    >
      <div className="space-y-2">
        <a
          href={shareLinksData.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Facebook className="w-5 h-5 text-blue-600" />
          <span>Facebook</span>
        </a>
        <a
          href={shareLinksData.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Twitter className="w-5 h-5 text-blue-400" />
          <span>Twitter</span>
        </a>
        <a
          href={shareLinksData.email}
          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Mail className="w-5 h-5 text-gray-600" />
          <span>Email</span>
        </a>
        <button
          onClick={handleCopyLink}
          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors text-left"
        >
          {copied ? (
            <>
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <LinkIcon className="w-5 h-5 text-gray-600" />
              <span>Copy Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductShareMenu;

