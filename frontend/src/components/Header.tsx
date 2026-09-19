import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, ChevronDown, ChevronRight, Search, Menu, X, LogOut, Phone, Heart, Camera } from 'lucide-react';
import VoiceSearchButton from './VoiceSearchButton';
import TonightBar from './TonightBar';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { blogService } from '@/services/blogs';
import BrandLogo from './BrandLogo';
import ConfirmationModal from './ConfirmationModal';
import { useToast } from '@/hooks/useToast';
import Toast from './Toast';
import SearchSuggestions from './SearchSuggestions';
import { decodeHtmlEntities } from '@/utils/htmlUtils';
import { cartItemCount } from '@/utils/cartCount';
import { generateCategoryUrl } from '@/utils/productUrl';

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const totalItems = useCartStore((state) => cartItemCount(state.items));
  const { items: wishlistItems } = useWishlistStore();
  const { toast, hideToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [expandedMobilePetTypes, setExpandedMobilePetTypes] = useState<Set<string>>(new Set());
  const [isLearningExpanded, setIsLearningExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);

  // Detect scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: petTypesResponse, isError: petTypesError, refetch: refetchPetTypes } = useQuery({
    queryKey: ['pet-types'],
    queryFn: async () => {
      const response = await api.get('/pet-types');
      if (response.data?.data) {
        localStorage.setItem('cached_petTypes', JSON.stringify(response.data.data));
      }
      return response.data;
    },
    retry: 1,
    staleTime: 20 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const channel = new BroadcastChannel('pet-types-updates');
    channel.onmessage = (event) => {
      if (event.data === 'pet-types-updated') {
        refetchPetTypes();
      }
    };
    return () => { channel.close(); };
  }, [refetchPetTypes]);

  const { data: categoriesResponse, isError: categoriesError, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data;
    },
    retry: 2,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    const channel = new BroadcastChannel('category-updates');
    channel.onmessage = (event) => {
      if (event.data === 'categories-updated') {
        refetchCategories();
      }
    };
    return () => { channel.close(); };
  }, [refetchCategories]);

  const getCachedPetTypes = () => {
    try {
      const cached = localStorage.getItem('cached_petTypes');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  };

  const getCachedCategories = () => {
    try {
      const cached = localStorage.getItem('cached_categories');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  };

  const formatPetTypeName = (slug: string) => {
    if (slug === 'all') return 'General';
    const pt = petTypes?.find((p: any) => p.slug === slug);
    return pt?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const LearningCategories = ({ onLinkClick }: { onLinkClick?: () => void } = {}) => {
    const { data: categoriesByPetType } = useQuery({
      queryKey: ['blog-categories-by-pet-type'],
      queryFn: () => blogService.getBlogCategoriesByPetType(),
      retry: false,
      staleTime: 10 * 60 * 1000
    });

    const linkClass = onLinkClick
      ? "block py-1.5 px-3 text-xs text-gray-600 hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors"
      : "text-xs text-gray-600 hover:text-[#1E3A8A] block transition-colors py-0.5";

    const staticPetTypes = ['dog', 'cat', 'fish', 'bird', 'reptile', 'small-pet'];
    const source = categoriesByPetType && categoriesByPetType.length > 0
      ? categoriesByPetType
      : staticPetTypes.map((petType) => ({ petType, categories: [{ name: 'Care', count: 1 }] }));

    const uniquePetTypes = [...new Map(
      source
        .filter(({ categories }: { categories: unknown[] }) => categories.length > 0)
        .map(({ petType }: { petType: string }) => [petType.toLowerCase(), petType])
    ).values()];

    return (
      <ul className="space-y-0.5">
        {uniquePetTypes.map((petType) => (
          <li key={petType}>
            <Link
              to={`/learning?petType=${encodeURIComponent(petType)}`}
              onClick={onLinkClick}
              className={linkClass}
            >
              {formatPetTypeName(petType)}
            </Link>
          </li>
        ))}
      </ul>
    );
  };

  let petTypes = petTypesError
    ? getCachedPetTypes()
    : (petTypesResponse?.data || getCachedPetTypes());

  if (!petTypes || petTypes.length === 0) {
    petTypes = [
      { name: 'Dog', slug: 'dog', icon: '🐕' },
      { name: 'Cat', slug: 'cat', icon: '🐱' },
      { name: 'Other Animals', slug: 'other-animals', icon: '🐾' }
    ];
  }

  const categories = categoriesError
    ? getCachedCategories()
    : (categoriesResponse?.data || getCachedCategories());

  const getCategoriesForPetType = (petTypeSlug: string) => {
    return categories
      .filter((cat: any) => cat.petType === petTypeSlug && !cat.parentCategory)
      .sort((a: any, b: any) => {
        const posA = a.position !== undefined ? a.position : 999999;
        const posB = b.position !== undefined ? b.position : 999999;
        if (posA !== posB) return posA - posB;
        return a.name.localeCompare(b.name);
      });
  };

  const getSubcategories = (categoryId: string) => {
    return categories
      .filter((cat: any) => cat.parentCategory?._id === categoryId || cat.parentCategory === categoryId)
      .sort((a: any, b: any) => {
        const posA = a.position !== undefined ? a.position : 999999;
        const posB = b.position !== undefined ? b.position : 999999;
        if (posA !== posB) return posA - posB;
        return a.name.localeCompare(b.name);
      });
  };

  interface MenuItem { name: string; slug: string; }
  interface MenuSection { _id: string; title: string; slug: string; items: MenuItem[]; }

  const buildDynamicMegaMenu = (petTypeSlug: string): MenuSection[] => {
    if (!categories || categories.length === 0) return [];
    const petTypeCategories = categories.filter((cat: any) =>
      cat.petType === petTypeSlug && cat.isActive !== false
    );
    const mainCategories = petTypeCategories
      .filter((cat: any) => !cat.parentCategory)
      .sort((a: any, b: any) => {
        const posA = a.position !== undefined ? a.position : 999999;
        const posB = b.position !== undefined ? b.position : 999999;
        if (posA !== posB) return posA - posB;
        return a.name.localeCompare(b.name);
      });
    return mainCategories.map((mainCat: any): MenuSection => {
      const categoryId = mainCat._id || String(mainCat._id);
      const subcategories = getSubcategories(categoryId)
        .filter((sub: any) => sub.isActive !== false)
        .map((sub: any) => ({ name: sub.name, slug: sub.slug, position: sub.position !== undefined ? sub.position : 999999 }))
        .sort((a: any, b: any) => {
          if (a.position !== b.position) return a.position - b.position;
          return a.name.localeCompare(b.name);
        })
        .map((item: any): MenuItem => ({ name: item.name, slug: item.slug }));
      return { _id: categoryId, title: mainCat.name, slug: mainCat.slug, items: subcategories };
    });
  };

  const goToSearch = (query: string) => {
    const q = query.trim();
    if (!q) return;
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setSearchQuery('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    goToSearch(searchQuery);
  };

  const handleVoiceResult = (transcript: string) => {
    setSearchQuery(transcript);
    setShowSuggestions(false);
    setMobileMenuOpen(false);
    goToSearch(transcript);
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const toggleMobilePetType = (petTypeSlug: string) => {
    setExpandedMobilePetTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(petTypeSlug)) { newSet.delete(petTypeSlug); } else { newSet.add(petTypeSlug); }
      return newSet;
    });
  };

  const toggleLearningMenu = () => { setIsLearningExpanded(prev => !prev); };

  const renderVerticalNavContent = (onLinkClick: () => void, options?: { compact?: boolean }) => {
    const compact = options?.compact ?? false;
    const px = compact ? 'px-3' : 'px-4';
    const py = 'py-3';

    return (
      <>
        {petTypes.map((petType: any) => {
          const petCategories = getCategoriesForPetType(petType.slug);
          const isExpanded = expandedMobilePetTypes.has(petType.slug);
          const megaMenu = Array.isArray(categories) && categories.length > 0 ? buildDynamicMegaMenu(petType.slug) : [];
          return (
            <li key={petType.slug}>
              {petCategories.length > 0 ? (
                <>
                  <button
                    onClick={() => toggleMobilePetType(petType.slug)}
                    className={`w-full flex items-center justify-between gap-3 ${py} ${px} font-semibold hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors overflow-hidden`}
                  >
                    <span className="truncate">{petType.name}</span>
                    <ChevronRight size={18} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                  {isExpanded && (
                    <div className={`ml-6 mt-2 space-y-2 ${compact ? '' : 'overflow-x-hidden max-w-full'}`}>
                      {megaMenu.length > 0 ? (
                        <>
                          {megaMenu.map((section: MenuSection) => (
                            <div key={section._id || section.slug} className="space-y-1 mb-3">
                              <Link to={generateCategoryUrl(section.slug, petType.slug)} onClick={onLinkClick} className="text-sm font-bold text-gray-900 px-3 block hover:text-[#1E3A8A] transition-colors">
                                {decodeHtmlEntities(section.title)} →
                              </Link>
                              <div className="space-y-1">
                                {section.items.map((item: MenuItem | string) => {
                                  const itemSlug = typeof item === 'object' ? item.slug : encodeURIComponent(String(item).toLowerCase().replace(/\s+/g, '-'));
                                  return (
                                    <Link key={typeof item === 'object' ? item.slug : String(item)} to={generateCategoryUrl(itemSlug, petType.slug)} onClick={onLinkClick} className={`block py-1.5 px-3 text-xs text-gray-600 hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors ${compact ? '' : 'truncate overflow-hidden'}`}>
                                      {decodeHtmlEntities(typeof item === 'object' ? item.name : item)}
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <>
                          {petCategories.map((category: any) => {
                            const subcategories = getSubcategories(category._id);
                            return (
                              <div key={category._id} className="space-y-1">
                                <Link to={generateCategoryUrl(category.slug, category.petType)} onClick={onLinkClick} className={`block py-2 px-3 text-sm font-semibold text-gray-900 hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors ${compact ? '' : 'truncate overflow-hidden'}`}>
                                  {decodeHtmlEntities(category.name)}
                                </Link>
                                {subcategories.length > 0 && (
                                  <div className={compact ? 'ml-3' : 'ml-4'} style={{ marginTop: '0.25rem' }}>
                                    {subcategories.map((sub: any) => {
                                      const subSubcategories = getSubcategories(sub._id);
                                      return (
                                        <div key={sub._id} className="space-y-1">
                                          <Link to={generateCategoryUrl(sub.slug, sub.petType)} onClick={onLinkClick} className={`block py-1.5 px-3 text-sm text-gray-600 hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors font-medium ${compact ? '' : 'truncate overflow-hidden'}`}>
                                            {decodeHtmlEntities(sub.name)}
                                          </Link>
                                          {subSubcategories.length > 0 && (
                                            <div className={compact ? 'ml-3' : 'ml-4'} style={{ marginTop: '0.25rem' }}>
                                              {subSubcategories.map((subSub: any) => (
                                                <Link key={subSub._id} to={generateCategoryUrl(subSub.slug, subSub.petType)} onClick={onLinkClick} className={`block py-1 px-3 text-xs text-gray-500 hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors ${compact ? '' : 'truncate overflow-hidden'}`}>
                                                  • {decodeHtmlEntities(subSub.name)}
                                                </Link>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <Link to={`/${petType.slug}`} onClick={onLinkClick} className={`block py-2 px-3 text-sm font-semibold text-[#1E3A8A] hover:underline ${compact ? '' : 'truncate overflow-hidden'}`}>
                            View All {petType.name} Products →
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <Link to={`/${petType.slug}`} onClick={onLinkClick} className={`flex items-center ${py} ${px} font-semibold hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors overflow-hidden`}>
                  <span className="truncate">{petType.name}</span>
                </Link>
              )}
            </li>
          );
        })}

        <li>
          <Link to="/products?featured=true" onClick={onLinkClick} className={`flex items-center gap-3 ${py} ${px} font-semibold text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors`}>
            <span>Featured</span>
          </Link>
        </li>

        <li>
          <button onClick={toggleLearningMenu} className={`w-full flex items-center justify-between gap-3 ${py} ${px} font-semibold hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors`}>
            <span>Learning</span>
            <ChevronRight size={18} className={`transition-transform ${isLearningExpanded ? 'rotate-90' : ''}`} />
          </button>
          {isLearningExpanded && (
            <div className="ml-6 mt-2 space-y-2 pb-2">
              <Link to="/learning" onClick={onLinkClick} className="block py-2 px-3 text-sm font-semibold text-[#1E3A8A] hover:underline">Learning Center →</Link>
              <Link to="/care-guides" onClick={onLinkClick} className="block py-1.5 px-3 text-xs text-gray-600 hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors">Care Guides →</Link>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-700 px-3 py-1">Categories</p>
                <LearningCategories onLinkClick={onLinkClick} />
              </div>
            </div>
          )}
        </li>

        <li>
          <Link to="/about" onClick={onLinkClick} className={`flex items-center ${py} ${px} font-semibold hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors`}>
            <span>About Us</span>
          </Link>
        </li>
        <li>
          <Link to="/our-promise" onClick={onLinkClick} className={`flex items-center ${py} ${px} font-semibold hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors`}>
            <span>Our Promise</span>
          </Link>
        </li>
      </>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 w-full">
        <TonightBar />
        <div className="bg-white w-full">
          <div className="container mx-auto px-3 lg:px-4 py-2 lg:py-3">
            <div className="flex items-center justify-between gap-2 lg:gap-4">

              {/* Hamburger - Desktop Only, Visible When Scrolled */}
              {isScrolled && (
                <button onClick={() => setIsLeftSidebarOpen(true)} className="hidden lg:flex items-center justify-center p-2 hover:bg-slate-100 rounded-md transition-colors" aria-label="Open Menu">
                  <Menu size={24} className="text-[#1E3A8A]" />
                </button>
              )}

              <Link to="/" className="flex items-center flex-shrink-0" aria-label="Petshiwu home">
                <BrandLogo variant="on-light" />
              </Link>

              {/* Search Bar - Desktop */}
              <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-xl xl:max-w-2xl mx-2 lg:mx-4 min-w-0">
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="Search or snap a photo of the bag..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => { if (searchQuery.length >= 1) { setShowSuggestions(true); } }}
                    className="w-full h-11 pl-4 pr-[8.5rem] rounded-md border border-slate-300 bg-slate-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] focus:bg-white placeholder:text-gray-500"
                  />
                  <div className="absolute inset-y-0 right-1.5 flex items-center gap-0.5">
                    <Link
                      to="/search?snap=1"
                      className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-[#1E3A8A] hover:bg-blue-50"
                      aria-label="Snap a photo of the bag"
                      title="Snap a photo of the bag"
                    >
                      <Camera size={18} />
                    </Link>
                    <VoiceSearchButton onResult={handleVoiceResult} variant="dark" />
                    <button
                      type="submit"
                      className="flex items-center justify-center w-9 h-9 rounded-md bg-[#1E3A8A] text-white hover:bg-[#163074]"
                      aria-label="Search"
                    >
                      <Search size={18} />
                    </button>
                  </div>
                  <SearchSuggestions
                    query={searchQuery}
                    isOpen={showSuggestions}
                    onClose={() => setShowSuggestions(false)}
                    onSelect={(query) => { setSearchQuery(query); goToSearch(query); }}
                  />
                </div>
              </form>

              {/* Right Side Actions */}
              <div className="flex items-center gap-1 lg:gap-2 text-[#1E3A8A] flex-shrink-0">

                {/* Customer Support - Desktop */}
                <div className="hidden lg:block relative group z-[100]">
                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer">
                    <Phone size={16} className="lg:w-[18px] lg:h-[18px]" />
                    <span className="text-xs lg:text-sm font-semibold">Support</span>
                  </div>
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg py-4 px-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-gray-900 z-[100]">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Support</p>
                      <div className="flex items-start gap-3 text-[#1E3A8A]">
                        <Phone size={20} className="mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-bold mb-1">We're Here to Help</p>
                          <p className="text-xs text-gray-600 mb-2">Call 24/7 · +1 (800) 259-2605</p>
                          <a href="tel:+18002592605" className="text-xl font-bold hover:underline block">Call Us</a>
                          <a href="tel:+18002592605" className="text-2xl font-black text-[#1E3A8A] hover:text-blue-700 block">+1 (800) 259-2605</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Favorites — desktop; Account tab covers this on mobile */}
                <Link to="/favorites" className="hidden lg:flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors">
                  <div className="relative">
                    <Heart size={18} className="lg:w-5 lg:h-5" fill={wishlistItems.length > 0 ? 'currentColor' : 'none'} />
                    {wishlistItems.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-[#1E3A8A] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
                      </span>
                    )}
                  </div>
                  <span className="hidden xl:block text-xs lg:text-sm font-semibold">Favorites</span>
                </Link>

                {/* Mobile Sign In / Account — tap, not hover */}
                <Link
                  to={isAuthenticated ? '/profile' : '/login'}
                  className="lg:hidden flex items-center p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                  aria-label={isAuthenticated ? 'My account' : 'Sign in'}
                >
                  <User size={18} />
                </Link>

                {/* Sign In / User Dropdown — desktop hover menu */}
                {isAuthenticated ? (
                  <div className="hidden lg:block relative group z-[100]">
                    <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors">
                      <User size={18} className="lg:w-5 lg:h-5" />
                      <span className="hidden xl:block text-xs lg:text-sm font-semibold">{user?.firstName}</span>
                      <ChevronDown size={14} className="hidden xl:block" />
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-gray-900 z-[100]">
                      <Link to="/profile" className="block px-4 py-2.5 hover:bg-gray-100 font-medium">My Profile</Link>
                      {user?.role === 'admin' && (
                        <a href="https://dashboard.petshiwu.com" className="block px-4 py-2.5 hover:bg-blue-50 text-[#1E3A8A] font-semibold border-b border-gray-100">Orders Dashboard</a>
                      )}
                      <Link to="/favorites" className="block px-4 py-2.5 hover:bg-blue-50 hover:text-[#1E3A8A] font-medium">
                        <div className="flex items-center gap-2">
                          <Heart size={18} className="text-[#1E3A8A]" fill="currentColor" />
                          My Favorites
                        </div>
                      </Link>
                      <Link to="/orders" className="block px-4 py-2.5 hover:bg-gray-100 font-medium">My Orders</Link>
                      <Link to="/#restock" className="block px-4 py-2.5 hover:bg-gray-100 font-medium">Restock</Link>
                      <button onClick={() => setShowLogoutModal(true)} className="block w-full text-left px-4 py-2.5 hover:bg-gray-100 font-medium">Logout</button>
                    </div>
                  </div>
                ) : (
                  <div className="hidden lg:block relative group z-[100]">
                    <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors">
                      <User size={18} className="lg:w-5 lg:h-5" />
                      <span className="hidden xl:block text-xs lg:text-sm font-semibold">Sign In</span>
                      <ChevronDown size={14} className="hidden xl:block" />
                    </button>
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-gray-900 z-[100]">
                      <Link to="/login" className="block px-4 py-2.5 hover:bg-gray-100 font-medium">Sign In</Link>
                      <Link to="/register" className="block px-4 py-2.5 hover:bg-gray-100 font-medium">Create an Account</Link>
                    </div>
                  </div>
                )}

                {/* Cart */}
                <div className="relative group">
                  <Link to="/cart" className="relative px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors flex items-center justify-center">
                    <ShoppingCart size={20} className="lg:w-6 lg:h-6" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#1E3A8A] text-white text-[10px] lg:text-xs rounded-full min-w-[18px] lg:min-w-[20px] h-[18px] lg:h-[20px] flex items-center justify-center font-bold leading-none">
                        {totalItems}
                      </span>
                    )}
                  </Link>
                  {!isAuthenticated && totalItems === 0 && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-4 px-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-gray-900">
                      <p className="text-sm font-semibold mb-2">Your cart is empty.</p>
                      <p className="text-xs text-gray-600">
                        Something missing? <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium underline">Sign in</Link> to see items you may have added from another device.
                      </p>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Toggle */}
                <button className="lg:hidden p-1.5 rounded-md hover:bg-slate-100 transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Open menu">
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>

            {/* Mobile search — always on the first screen, Chewy-style */}
            <form onSubmit={handleSearch} className="lg:hidden mt-2 pb-0.5">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search or snap a photo of the bag..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => { if (searchQuery.length >= 1) { setShowSuggestions(true); } }}
                  className="w-full h-10 pl-3 pr-[7.5rem] rounded-md border border-slate-300 bg-slate-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] placeholder:text-gray-500"
                  aria-label="Search products"
                />
                <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
                  <Link
                    to="/search?snap=1"
                    className="flex items-center justify-center w-8 h-8 rounded-md text-gray-500 hover:text-[#1E3A8A]"
                    aria-label="Snap a photo of the bag"
                  >
                    <Camera size={18} />
                  </Link>
                  <VoiceSearchButton onResult={handleVoiceResult} variant="dark" />
                  <button type="submit" className="flex items-center justify-center w-8 h-8 rounded-md bg-[#1E3A8A] text-white" aria-label="Search">
                    <Search size={16} />
                  </button>
                </div>
                <SearchSuggestions
                  query={searchQuery}
                  isOpen={showSuggestions}
                  onClose={() => setShowSuggestions(false)}
                  onSelect={(query) => { setSearchQuery(query); goToSearch(query); }}
                />
              </div>
            </form>
          </div>
        </div>
      </header>

      {/* Navigation - Desktop Only */}
      <nav className="hidden lg:block bg-[#1E3A8A] w-full z-30">
        <div className="relative w-full">
          <div className="container mx-auto px-2 lg:px-3">
            <div className="flex items-center justify-start py-0">
              <ul className="flex items-center gap-0.5 lg:gap-1 text-sm font-medium text-white flex-nowrap">
                {petTypes.map((petType: any) => {
                  const petCategories = getCategoriesForPetType(petType.slug);
                  const megaMenu = Array.isArray(categories) && categories.length > 0 ? buildDynamicMegaMenu(petType.slug) : [];
                  return (
                    <li key={petType.slug} className="relative group flex-shrink-0">
                      <Link to={`/${petType.slug}`} className="flex items-center gap-1 hover:bg-white/10 transition-colors py-2.5 px-3 whitespace-nowrap">
                        <span className="whitespace-nowrap">{petType.name}</span>
                        {petCategories.length > 0 && <ChevronDown size={14} className="opacity-60 group-hover:opacity-100 transition-opacity" />}
                      </Link>
                      {petCategories.length > 0 && (
                        <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-4 px-5 w-[90vw] max-w-[900px] max-h-[500px] overflow-y-auto opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                          {megaMenu.length > 0 ? (
                            <div className="grid grid-cols-4 gap-6">
                              {megaMenu.map((section: MenuSection) => (
                                <div key={section._id || section.slug} className="space-y-2">
                                  <Link to={generateCategoryUrl(section.slug, petType.slug)} className="font-bold text-sm text-gray-900 hover:text-[#1E3A8A] cursor-pointer transition-colors block">
                                    {decodeHtmlEntities(section.title)} →
                                  </Link>
                                  <ul className="space-y-1">
                                    {section.items.map((item: MenuItem | string) => {
                                      const itemSlug = typeof item === 'object' ? item.slug : encodeURIComponent(String(item).toLowerCase().replace(/\s+/g, '-'));
                                      return (
                                        <li key={typeof item === 'object' ? item.slug : String(item)}>
                                          <Link to={generateCategoryUrl(itemSlug, petType.slug)} className="text-xs text-gray-600 hover:text-[#1E3A8A] block transition-colors py-0.5">
                                            {decodeHtmlEntities(typeof item === 'object' ? item.name : item)}
                                          </Link>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-3">
                              {petCategories.map((category: any) => {
                                const subcategories = getSubcategories(category._id);
                                return (
                                  <div key={category._id} className="space-y-1.5 pb-2 border-b border-gray-100 last:border-b-0 last:pb-0">
                                    <Link to={generateCategoryUrl(category.slug, category.petType)} className="font-bold text-sm text-gray-900 hover:text-[#1E3A8A] block transition-colors">
                                      {decodeHtmlEntities(category.name)}
                                    </Link>
                                    {subcategories.length > 0 && (
                                      <ul className="space-y-0.5 ml-3">
                                        {subcategories.map((sub: any) => {
                                          const subSubcategories = getSubcategories(sub._id);
                                          return (
                                            <li key={sub._id} className="space-y-0.5">
                                              <Link to={generateCategoryUrl(sub.slug, sub.petType)} className="text-xs text-gray-600 hover:text-[#1E3A8A] block transition-colors font-medium py-0.5">
                                                {decodeHtmlEntities(sub.name)}
                                              </Link>
                                              {subSubcategories.length > 0 && (
                                                <ul className="space-y-0.5 ml-3">
                                                  {subSubcategories.map((subSub: any) => (
                                                    <li key={subSub._id}>
                                                      <Link to={generateCategoryUrl(subSub.slug, subSub.petType)} className="text-[10px] text-gray-500 hover:text-[#1E3A8A] block transition-colors py-0.5">
                                                        • {decodeHtmlEntities(subSub.name)}
                                                      </Link>
                                                    </li>
                                                  ))}
                                                </ul>
                                              )}
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    )}
                                  </div>
                                );
                              })}
                              <Link to={`/${petType.slug}`} className="text-xs font-semibold text-[#1E3A8A] hover:underline mt-3 pt-2 border-t border-gray-200 block">
                                View All {petType.name} Products →
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}

                <li className="flex-shrink-0">
                  <Link to="/products?featured=true" className="flex items-center py-2.5 px-3 font-semibold whitespace-nowrap hover:bg-white/10">
                    Featured
                  </Link>
                </li>

                <li className="relative group flex-shrink-0">
                  <Link to="/learning" className="flex items-center gap-1 hover:bg-white/10 transition-colors py-2.5 px-3 whitespace-nowrap">
                    <span>Learning</span>
                    <ChevronDown size={14} className="opacity-70" />
                  </Link>
                  <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-4 px-5 w-[90vw] max-w-[600px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="space-y-2">
                      <Link to="/learning" className="font-bold text-sm text-gray-900 hover:text-[#1E3A8A] cursor-pointer transition-colors block mb-3">Learning Center →</Link>
                      <LearningCategories />
                    </div>
                  </div>
                </li>

                <li className="flex-shrink-0">
                  <Link to="/about" className="hover:bg-white/10 transition-colors py-2.5 px-3 whitespace-nowrap">About</Link>
                </li>
                <li className="flex-shrink-0">
                  <Link to="/our-promise" className="hover:bg-white/10 transition-colors py-2.5 px-3 whitespace-nowrap">Our Promise</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[45] lg:hidden" onClick={() => { setMobileMenuOpen(false); setIsLearningExpanded(false); }} />
          <div className="fixed top-0 right-0 h-full w-[85vw] max-w-sm bg-white shadow-2xl z-[50] lg:hidden overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
              <BrandLogo variant="on-light" />
              <button onClick={() => { setMobileMenuOpen(false); setIsLearningExpanded(false); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Close Menu">
                <X size={24} className="text-gray-700" />
              </button>
            </div>
            <div className="px-4 py-4 overflow-x-hidden">
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for products..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => { if (searchQuery.length >= 1) { setShowSuggestions(true); } }}
                    className="w-full h-11 pl-4 pr-24 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                  <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
                    <VoiceSearchButton onResult={handleVoiceResult} variant="dark" />
                    <button type="submit" className="flex items-center justify-center w-9 h-9 rounded-md text-gray-600 hover:text-gray-900" aria-label="Search">
                      <Search size={20} />
                    </button>
                  </div>
                  <SearchSuggestions
                    query={searchQuery}
                    isOpen={showSuggestions}
                    onClose={() => setShowSuggestions(false)}
                    onSelect={(query) => { setSearchQuery(query); goToSearch(query); }}
                  />
                </div>
              </form>
              <ul className="space-y-1 text-gray-700 overflow-x-hidden">
                {renderVerticalNavContent(() => { setMobileMenuOpen(false); setIsLearningExpanded(false); }, { compact: true })}
                {isAuthenticated ? (
                  <>
                    <li><Link to="/profile" className="flex items-center gap-3 py-3 px-3 font-semibold hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}><User size={20} /><span>My Profile</span></Link></li>
                    {user?.role === 'admin' && (
                      <li><a href="https://dashboard.petshiwu.com" className="flex items-center gap-3 py-3 px-3 font-semibold bg-blue-50 text-[#1E3A8A] rounded-lg"><span>Orders Dashboard</span></a></li>
                    )}
                    <li><Link to="/favorites" className="flex items-center gap-3 py-3 px-3 font-semibold hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}><Heart size={20} className="text-[#1E3A8A]" fill="currentColor" /><span>My Favorites</span></Link></li>
                    <li><Link to="/orders" className="flex items-center gap-3 py-3 px-3 font-semibold hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}><ShoppingCart size={20} /><span>My Orders</span></Link></li>
                    <li><Link to="/#restock" className="flex items-center gap-3 py-3 px-3 font-semibold hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}><span>Restock</span></Link></li>
                    <li><button onClick={() => { setShowLogoutModal(true); setMobileMenuOpen(false); }} className="flex items-center gap-3 w-full text-left py-3 px-3 font-semibold hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"><LogOut size={20} /><span>Logout</span></button></li>
                  </>
                ) : (
                  <li><Link to="/login" className="flex items-center gap-3 py-3 px-3 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#163074] transition-colors font-semibold" onClick={() => setMobileMenuOpen(false)}><User size={20} /><span>Sign In / Register</span></Link></li>
                )}
              </ul>
            </div>
          </div>
        </>
      )}

      {/* Left Sidebar - Desktop */}
      {isLeftSidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 lg:block hidden" onClick={() => { setIsLeftSidebarOpen(false); setIsLearningExpanded(false); }} />
          <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Shop by Category</h2>
                <button onClick={() => { setIsLeftSidebarOpen(false); setIsLearningExpanded(false); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Close Menu">
                  <X size={24} className="text-gray-700" />
                </button>
              </div>
              <ul className="space-y-1">
                {renderVerticalNavContent(() => { setIsLeftSidebarOpen(false); setIsLearningExpanded(false); })}
              </ul>
            </div>
          </div>
        </>
      )}

      {/* Logout Modal */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out? You'll need to sign in again to access your account."
        confirmText="Logout"
        cancelText="Stay Logged In"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        icon={<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center"><LogOut className="text-red-600" size={32} /></div>}
      />

      {/* Toast */}
      {toast.isVisible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </>
  );
};

export default Header;
