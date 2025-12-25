import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, ChevronDown, ChevronRight, Search, Menu, X, LogOut, Phone, Heart } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { blogService } from '@/services/blogs';
import ConfirmationModal from './ConfirmationModal';
import { useToast } from '@/hooks/useToast';
import Toast from './Toast';
import SearchSuggestions from './SearchSuggestions';

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { getTotalItems } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { toast, hideToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [expandedMobilePetTypes, setExpandedMobilePetTypes] = useState<Set<string>>(new Set());
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);

  // Detect scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 100); // Show hamburger menu after 100px scroll
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch pet types with error handling and localStorage caching
  const { data: petTypesResponse, isError: petTypesError } = useQuery({
    queryKey: ['pet-types'],
    queryFn: async () => {
      const response = await api.get('/pet-types');
      // Save to localStorage when successfully fetched
      if (response.data?.data) {
        localStorage.setItem('cached_petTypes', JSON.stringify(response.data.data));
      }
      return response.data;
    },
    retry: 1, // Reduce retries to prevent rate limiting
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes (pet types don't change often)
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus to reduce requests
  });

  // Fetch categories - backend cache is now properly cleared on updates
  const { data: categoriesResponse, isError: categoriesError, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data;
    },
    retry: 2,
    staleTime: 30 * 1000, // Consider fresh for 30 seconds to reduce refetch frequency
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when user comes back to tab
    refetchOnMount: true, // Always refetch when component mounts
  });

  // Listen for category updates from admin dashboard using BroadcastChannel
  useEffect(() => {
    // Use BroadcastChannel for efficient cross-tab communication
    const channel = new BroadcastChannel('category-updates');
    
    channel.onmessage = (event) => {
      if (event.data === 'categories-updated') {
        // Admin made changes, refetch categories immediately
        refetchCategories();
      }
    };

    return () => {
      channel.close();
    };
  }, [refetchCategories]);

  // Get cached data from localStorage if database is down
  const getCachedPetTypes = () => {
    try {
      const cached = localStorage.getItem('cached_petTypes');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  };

  const getCachedCategories = () => {
    try {
      const cached = localStorage.getItem('cached_categories');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  };

  // Learning Center Categories Component
  const LearningCategories = () => {
    const { data: categories } = useQuery({
      queryKey: ['blog-categories', 'learning'],
      queryFn: () => blogService.getBlogCategories(),
      retry: false,
      staleTime: 10 * 60 * 1000
    });

    const learningCategories = [
      'Dog Care',
      'Cat Care',
      'Fish Care',
      'Fish Compatibility Guide'
    ];

    const displayCategories = categories && categories.length > 0 
      ? categories.filter((cat: any) => learningCategories.includes(cat.name))
      : learningCategories.map((name) => ({ name, count: 0 }));

    return (
      <ul className="space-y-1">
        <li>
          <Link
            to="/care-guides"
            className="text-xs font-semibold text-[#1E3A8A] hover:text-[#1E40AF] block transition-colors py-1 mb-1"
          >
            Care Guides →
          </Link>
        </li>
        {displayCategories.map((cat: any, index: number) => {
          const name = typeof cat === 'string' ? cat : cat.name;
          return (
            <li key={index}>
              <Link
                to={`/learning?category=${encodeURIComponent(name)}`}
                className="text-xs text-gray-600 hover:text-[#1E3A8A] block transition-colors py-0.5"
              >
                {name}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  // New Pet Categories Component
  const NewPetCategories = () => {
    const { data: petTypes } = useQuery({
      queryKey: ['pet-types'],
      queryFn: async () => {
        const response = await api.get('/pet-types');
        return response.data;
      },
      retry: false,
      staleTime: 10 * 60 * 1000
    });

    const newPetTypes = ['Dog', 'Cat', 'Small Pet', 'Fish'];
    const displayTypes = petTypes?.data 
      ? petTypes.data.filter((pt: any) => newPetTypes.includes(pt.name))
      : newPetTypes.map((name) => ({ name, slug: name.toLowerCase().replace(/\s+/g, '-') }));

    return (
      <ul className="space-y-1">
        {displayTypes.map((pt: any, index: number) => {
          const name = typeof pt === 'string' ? pt : pt.name;
          const slug = typeof pt === 'string' ? pt.toLowerCase().replace(/\s+/g, '-') : pt.slug;
          return (
            <li key={index}>
              <Link
                to={`/learning?petType=${slug}&category=New Pet`}
                className="text-xs text-gray-600 hover:text-[#1E3A8A] block transition-colors py-0.5"
              >
                {name}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  // Use actual database data, or cached data if database is down
  let petTypes = petTypesError 
    ? getCachedPetTypes() 
    : (petTypesResponse?.data || getCachedPetTypes());

  // Fallback pet types if none are loaded
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

  // Group categories by pet type
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

  // Get subcategories for a category (works for any level)
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

  // Get the level of a category (1 = main, 2 = sub, 3 = sub-sub, etc.)
  const getCategoryLevel = (category: any): number => {
    if (!category.parentCategory) return 1;
    const parent = categories.find((cat: any) => 
      cat._id === category.parentCategory || cat._id === category.parentCategory?._id
    );
    if (!parent) return 2;
    return getCategoryLevel(parent) + 1;
  };

  // Build dynamic mega menu from categories for a specific pet type
  interface MenuItem {
    name: string;
    slug: string;
  }

  interface MenuSection {
    _id: string;
    title: string;
    slug: string;
    items: MenuItem[];
  }

  const buildDynamicMegaMenu = (petTypeSlug: string): MenuSection[] => {
    if (!categories || categories.length === 0) return [];
    
    // Get all active categories for this pet type (including those with parentCategory)
    const petTypeCategories = categories.filter((cat: any) => 
      cat.petType === petTypeSlug && cat.isActive !== false
    );

    // Get main categories (no parent) - these are the top-level categories
    // Sort by position first, then by name as fallback
    const mainCategories = petTypeCategories
      .filter((cat: any) => !cat.parentCategory)
      .sort((a: any, b: any) => {
        const posA = a.position !== undefined ? a.position : 999999;
        const posB = b.position !== undefined ? b.position : 999999;
        if (posA !== posB) return posA - posB;
        return a.name.localeCompare(b.name);
      });
    
    // Build menu structure: each main category with its subcategories as items
    return mainCategories.map((mainCat: any): MenuSection => {
      const categoryId = mainCat._id || String(mainCat._id);
      const subcategories = getSubcategories(categoryId)
        .filter((sub: any) => sub.isActive !== false)
        .map((sub: any) => ({
          name: sub.name,
          slug: sub.slug,
          position: sub.position !== undefined ? sub.position : 999999
        }))
        .sort((a: any, b: any) => {
          // Sort by position first, then by name
          if (a.position !== b.position) return a.position - b.position;
          return a.name.localeCompare(b.name);
        })
        .map((item: any): MenuItem => ({
          name: item.name,
          slug: item.slug
        }));

      return {
        _id: categoryId,
        title: mainCat.name,
        slug: mainCat.slug,
        items: subcategories
      };
    });
  };

  // Build dynamic menus for each pet type
  // Use dynamic menus from database, with fallback to empty array if no categories loaded
  const dogMegaMenu = Array.isArray(categories) && categories.length > 0 ? buildDynamicMegaMenu('dog') : [];
  const catMegaMenu = Array.isArray(categories) && categories.length > 0 ? buildDynamicMegaMenu('cat') : [];
  const otherAnimalsMegaMenu = Array.isArray(categories) && categories.length > 0 ? buildDynamicMegaMenu('other-animals') : [];

  const dogSpecialLinks = [
    'Dog Deals',
    'New Dog Supplies',
    'Pet Parent Supplies',
    'Shop all Dog'
  ];

  const catSpecialLinks = [
    'Cat Deals',
    'Pet Parent Supplies',
    'Shop all Cat'
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout(); // This will reload the page automatically
    setMobileMenuOpen(false);
  };


  const toggleMobilePetType = (petTypeSlug: string) => {
    setExpandedMobilePetTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(petTypeSlug)) {
        newSet.delete(petTypeSlug);
      } else {
        newSet.add(petTypeSlug);
      }
      return newSet;
    });
  };

  return (
    <>
      <header className="bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#1E3A8A] sticky top-0 z-40 shadow-xl w-full">
        {/* Main Header */}
        <div className="w-full">
          <div className="container mx-auto px-3 lg:px-4 py-2 lg:py-3">
          <div className="flex items-center justify-between gap-2 lg:gap-4">
            {/* Hamburger Menu Button - Desktop Only, Visible When Scrolled */}
            {isScrolled && (
              <button
                onClick={() => setIsLeftSidebarOpen(true)}
                className="hidden lg:flex items-center justify-center p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Open Menu"
              >
                <Menu size={28} className="text-white" />
              </button>
            )}
            {/* Logo with Enhanced Animation */}
            <Link to="/" className="flex items-center gap-2 lg:gap-3 flex-shrink-0 group">
            <div className="relative">
              <img 
                src="/logo.png" 
                alt="petshiwu Logo" 
                width={80}
                height={80}
                className="h-16 w-16 md:h-20 md:w-20 object-contain transform group-hover:scale-125 group-hover:rotate-6 transition-all duration-500 drop-shadow-2xl relative z-10"
                loading="eager"
                fetchPriority="high"
              />
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-white/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
              <span className="text-xl lg:text-2xl xl:text-3xl font-black text-white tracking-tight transition-all duration-300" style={{ fontFamily: "'Nunito', sans-serif" }}>
                Petshiwu
              </span>
            </Link>

            {/* Search Bar - Desktop with Enhanced Design */}
            <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-xl xl:max-w-2xl mx-2 lg:mx-4 min-w-0" style={{ minHeight: '48px' }}>
            <div className="relative w-full group">
              <input
                type="text"
                placeholder="Search for products, brands, or pet types..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (searchQuery.length >= 2) {
                    setShowSuggestions(true);
                  }
                }}
                style={{ minHeight: '48px' }}
                className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-white/20 bg-white/95 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-300 shadow-lg hover:shadow-xl transition-all placeholder:text-gray-500 font-medium"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg transform hover:scale-110"
                aria-label="Search"
              >
                <Search size={18} />
              </button>
              <SearchSuggestions
                query={searchQuery}
                isOpen={showSuggestions}
                onClose={() => setShowSuggestions(false)}
                onSelect={(query) => {
                  setSearchQuery(query);
                  setShowSuggestions(false);
                  navigate(`/products?search=${encodeURIComponent(query)}`);
                }}
              />
            </div>
          </form>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 lg:gap-3 text-white flex-shrink-0">
              {/* USA Flag - Desktop */}
              <div className="hidden lg:flex items-center gap-2 px-2 lg:px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer">
                <img 
                  src="https://flagcdn.com/w40/us.png" 
                  alt="USA Flag" 
                  className="w-5 h-4 lg:w-6 lg:h-4 object-cover rounded-sm"
                />
                <span className="text-xs lg:text-sm font-semibold">USA</span>
                <ChevronDown size={12} className="opacity-80" />
              </div>

              {/* Customer Support - Desktop with Dropdown */}
              <div className="hidden lg:block relative group z-[100]">
                <div className="flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer">
                  <Phone size={16} className="lg:w-[18px] lg:h-[18px]" />
                  <span className="text-xs lg:text-sm font-semibold">Support</span>
                  <ChevronDown size={12} className="opacity-80" />
                </div>
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg py-4 px-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-gray-900 z-[100]">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Support</p>
                    <div className="flex items-start gap-3 text-[#1E3A8A]">
                      <Phone size={20} className="mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold mb-1">We're Here to Help</p>
                        <p className="text-xs text-gray-600 mb-2">Mon-Fri: 9AM - 8PM EST | Sat-Sun: 9AM - 6PM EST</p>
                        <a 
                          href="tel:+16263420419" 
                          className="text-xl font-bold hover:underline block"
                        >
                          Call Us
                        </a>
                        <a 
                          href="tel:+16263420419" 
                          className="text-2xl font-black text-[#1E3A8A] hover:text-blue-700 block"
                        >
                          +1 (626) 342-0419
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Favorites Button */}
              <Link
                to="/favorites"
                className="relative flex items-center gap-1 lg:gap-1.5 hover:opacity-80 px-1.5 lg:px-2.5 py-1.5 rounded-md hover:bg-white/10 transition-colors"
              >
                <div className="relative">
                  <Heart 
                    size={18} 
                    className="lg:w-5 lg:h-5"
                    fill={wishlistItems.length > 0 ? 'currentColor' : 'none'}
                  />
                  {wishlistItems.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
                    </span>
                  )}
                </div>
                <span className="hidden xl:block text-xs lg:text-sm font-semibold">Favorites</span>
              </Link>

              {/* Sign In / User Dropdown */}
              {isAuthenticated ? (
                <div className="relative group z-[100]">
                  <button className="flex items-center gap-1 lg:gap-1.5 hover:opacity-80 px-1.5 lg:px-2.5 py-1.5 rounded-md hover:bg-white/10 transition-colors">
                    <User size={18} className="lg:w-5 lg:h-5" />
                    <span className="hidden xl:block text-xs lg:text-sm font-semibold">{user?.firstName}</span>
                    <ChevronDown size={14} className="hidden xl:block" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-gray-900 z-[100]">
                    <Link
                      to="/profile"
                      className="block px-4 py-2.5 hover:bg-gray-100 font-medium"
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/favorites"
                      className="block px-4 py-2.5 hover:bg-pink-50 hover:text-pink-600 font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <Heart size={18} className="text-pink-500" fill="currentColor" />
                        My Favorites
                      </div>
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-4 py-2.5 hover:bg-gray-100 font-medium"
                    >
                      My Orders
                    </Link>
                    <button
                      onClick={() => setShowLogoutModal(true)}
                      className="block w-full text-left px-4 py-2.5 hover:bg-gray-100 font-medium"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative group z-[100]">
                  <button className="flex items-center gap-1 lg:gap-1.5 hover:opacity-80 px-1.5 lg:px-2.5 py-1.5 rounded-md hover:bg-white/10 transition-colors">
                    <User size={18} className="lg:w-5 lg:h-5" />
                    <span className="hidden xl:block text-xs lg:text-sm font-semibold">Sign In</span>
                    <ChevronDown size={14} className="hidden xl:block" />
                  </button>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-gray-900 z-[100]">
                    <Link
                      to="/login"
                      className="block px-4 py-2.5 hover:bg-gray-100 font-medium"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="block px-4 py-2.5 hover:bg-gray-100 font-medium"
                    >
                      Create an Account
                    </Link>
                  </div>
                </div>
              )}

              {/* Cart with Enhanced Animation */}
              <div className="relative group">
                <Link to="/cart" className="relative px-1.5 lg:px-2.5 py-1.5 lg:py-2 rounded-xl hover:bg-white/15 transition-all hover:scale-110 flex items-center justify-center">
                  <ShoppingCart size={20} className="lg:w-6 lg:h-6 group-hover:animate-wiggle" />
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-1 -right-1 lg:-top-2 lg:-right-2 bg-gradient-to-r from-red-500 to-pink-600 text-white text-[10px] lg:text-xs rounded-full min-w-[18px] lg:min-w-[22px] h-[18px] lg:h-[22px] flex items-center justify-center font-black shadow-lg animate-pulse-slow border-2 border-white leading-none">
                      {getTotalItems()}
                    </span>
                  )}
                </Link>
                {/* Hover Tooltip for Non-Authenticated Users */}
                {!isAuthenticated && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-4 px-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-gray-900">
                    <p className="text-sm font-semibold mb-2">Your cart is empty.</p>
                    <p className="text-xs text-gray-600">
                      Something missing? <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium underline">Sign in</Link> to see items you may have added from another computer or device.
                    </p>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden p-1.5 rounded-md hover:bg-white/10 transition-colors ml-1"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar - Mobile - Now inside fixed menu */}
    </header>

    {/* Navigation - Desktop Only */}
    <nav className="hidden lg:block bg-white border-t border-gray-200 w-full z-30">
      <div className="relative w-full">
        <div className="container mx-auto px-2 lg:px-3">
          <div className="flex items-center justify-start py-2 lg:py-2.5">
            <ul className="flex items-center gap-1.5 lg:gap-2.5 text-xs lg:text-sm font-semibold text-gray-700 flex-nowrap">
                {/* Dynamic Pet Types with Dropdowns */}
                  {petTypes.map((petType: any) => {
                    const petCategories = getCategoriesForPetType(petType.slug);
                    const isSpecialDogMenu = petType.slug === 'dog';
                    const isSpecialCatMenu = petType.slug === 'cat';
                    const isSpecialOtherAnimalsMenu = petType.slug === 'other-animals';
                    
                    return (
                      <li key={petType.slug} className="relative group flex-shrink-0">
                        <Link 
                          to={`/${petType.slug}`} 
                          className="flex items-center gap-0.5 lg:gap-1 hover:text-[#1E3A8A] transition-colors py-1.5 lg:py-2 px-1 lg:px-1.5 whitespace-nowrap"
                        >
                          <span className="text-sm lg:text-base flex-shrink-0 leading-none">{petType.icon}</span>
                          <span className="text-xs lg:text-sm whitespace-nowrap">{petType.name}</span>
                          {(petCategories.length > 0 || isSpecialDogMenu || isSpecialCatMenu || isSpecialOtherAnimalsMenu) && (
                            <ChevronDown size={14} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                          )}
                        </Link>
                        
                        {/* Special Dog Mega Menu */}
                        {isSpecialDogMenu && (
                          <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-4 px-5 w-[90vw] max-w-[900px] max-h-[500px] overflow-y-auto opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <div className="grid grid-cols-4 gap-6">
                              {dogMegaMenu.map((section: MenuSection) => (
                                <div key={section._id || section.slug} className="space-y-2">
                                  <Link
                                    to={`/category/${section.slug}?petType=dog`}
                                    className="font-bold text-sm text-gray-900 hover:text-[#1E3A8A] cursor-pointer transition-colors block"
                                  >
                                    {section.title} →
                                  </Link>
                                  <ul className="space-y-1">
                                    {section.items.map((item: MenuItem | string) => (
                                      <li key={typeof item === 'object' ? item.slug : String(item)}>
                                        <Link
                                          to={`/category/${typeof item === 'object' ? item.slug : encodeURIComponent(String(item).toLowerCase().replace(/\s+/g, '-'))}?petType=dog`}
                                          className="text-xs text-gray-600 hover:text-[#1E3A8A] block transition-colors py-0.5"
                                        >
                                          {typeof item === 'object' ? item.name : item}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                            
                            {/* Special Links */}
                            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-3">
                              {dogSpecialLinks.map((link, idx) => (
                                <Link
                                  key={idx}
                                  to={`/dog`}
                                  className="text-xs font-semibold text-[#1E3A8A] hover:underline"
                                >
                                  {link} →
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Special Cat Mega Menu */}
                        {isSpecialCatMenu && (
                          <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-4 px-5 w-[90vw] max-w-[900px] max-h-[500px] overflow-y-auto opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <div className="grid grid-cols-4 gap-6">
                              {catMegaMenu.map((section: MenuSection) => (
                                <div key={section._id || section.slug} className="space-y-2">
                                  <Link
                                    to={`/category/${section.slug}?petType=cat`}
                                    className="font-bold text-sm text-gray-900 hover:text-[#1E3A8A] cursor-pointer transition-colors block"
                                  >
                                    {section.title} →
                                  </Link>
                                  <ul className="space-y-1">
                                    {section.items.map((item: MenuItem | string) => (
                                      <li key={typeof item === 'object' ? item.slug : String(item)}>
                                        <Link
                                          to={`/category/${typeof item === 'object' ? item.slug : encodeURIComponent(String(item).toLowerCase().replace(/\s+/g, '-'))}?petType=cat`}
                                          className="text-xs text-gray-600 hover:text-[#1E3A8A] block transition-colors py-0.5"
                                        >
                                          {typeof item === 'object' ? item.name : item}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                            
                            {/* Special Links */}
                            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-3">
                              {catSpecialLinks.map((link, idx) => (
                                <Link
                                  key={idx}
                                  to={`/cat`}
                                  className="text-xs font-semibold text-[#1E3A8A] hover:underline"
                                >
                                  {link} →
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Special Other Animals Mega Menu */}
                        {isSpecialOtherAnimalsMenu && (
                          <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-4 px-5 w-[90vw] max-w-[900px] max-h-[500px] overflow-y-auto opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <div className="grid grid-cols-4 gap-6">
                              {otherAnimalsMegaMenu.map((section: MenuSection) => (
                                <div key={section._id || section.slug} className="space-y-2">
                                  <Link
                                    to={`/category/${section.slug}?petType=other-animals`}
                                    className="font-bold text-sm text-gray-900 hover:text-[#1E3A8A] cursor-pointer transition-colors block"
                                  >
                                    {section.title} →
                                  </Link>
                                  <ul className="space-y-1">
                                    {section.items.map((item: MenuItem | string) => (
                                      <li key={typeof item === 'object' ? item.slug : String(item)}>
                                        <Link
                                          to={`/category/${typeof item === 'object' ? item.slug : encodeURIComponent(String(item).toLowerCase().replace(/\s+/g, '-'))}?petType=other-animals`}
                                          className="text-xs text-gray-600 hover:text-[#1E3A8A] block transition-colors py-0.5"
                                        >
                                          {typeof item === 'object' ? item.name : item}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Regular Dropdown Mega Menu for other pet types */}
                        {!isSpecialDogMenu && !isSpecialCatMenu && !isSpecialOtherAnimalsMenu && petCategories.length > 0 && (
                          <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-4 px-5 min-w-[280px] max-w-sm max-h-[500px] overflow-y-auto opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            {false ? (
                              // Special display for "Other Animals" - show categories as animal types
                              <div className="space-y-3">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                  Shop by Animal
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                  {petCategories.map((category: any) => (
                                    <Link
                                      key={category._id}
                                      to={`/category/${category.slug}${category.petType && category.petType !== 'all' ? `?petType=${category.petType}` : ''}`}
                                      className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-blue-50 hover:text-[#1E3A8A] transition-all group/item"
                                    >
                                      {category.image && (
                                        <img 
                                          src={category.image} 
                                          alt={category.name}
                                          className="w-12 h-12 object-cover rounded-full"
                                        />
                                      )}
                                      <span className="text-sm font-semibold text-center group-hover/item:text-[#1E3A8A]">
                                        {category.name}
                                      </span>
                                    </Link>
                                  ))}
                                </div>
                                <Link
                                  to={`/${petType.slug}`}
                                  className="text-sm font-semibold text-[#1E3A8A] hover:underline mt-3 block text-center"
                                >
                                  View All {petType.name} →
                                </Link>
                              </div>
                            ) : (
                              // Standard display for other pet types - show categories with all subcategory levels
                              <div className="grid grid-cols-1 gap-3">
                                {petCategories.map((category: any) => {
                                  const subcategories = getSubcategories(category._id);
                                  
                                  return (
                                    <div key={category._id} className="space-y-1.5 pb-2 border-b border-gray-100 last:border-b-0 last:pb-0">
                                      <Link
                                        to={`/category/${category.slug}${category.petType && category.petType !== 'all' ? `?petType=${category.petType}` : ''}`}
                                        className="font-bold text-sm text-gray-900 hover:text-[#1E3A8A] block transition-colors"
                                      >
                                        {category.name}
                                      </Link>
                                      
                                      {subcategories.length > 0 && (
                                        <ul className="space-y-0.5 ml-3">
                                          {subcategories.map((sub: any) => {
                                            const subSubcategories = getSubcategories(sub._id);
                                            
                                            return (
                                              <li key={sub._id} className="space-y-0.5">
                                                <Link
                                                  to={`/category/${sub.slug}${sub.petType && sub.petType !== 'all' ? `?petType=${sub.petType}` : ''}`}
                                                  className="text-xs text-gray-600 hover:text-[#1E3A8A] block transition-colors font-medium py-0.5"
                                                >
                                                  {sub.name}
                                                </Link>
                                                
                                                {/* 3rd Level Subcategories */}
                                                {subSubcategories.length > 0 && (
                                                  <ul className="space-y-0.5 ml-3">
                                                    {subSubcategories.map((subSub: any) => (
                                                      <li key={subSub._id}>
                                                        <Link
                                                          to={`/category/${subSub.slug}${subSub.petType && subSub.petType !== 'all' ? `?petType=${subSub.petType}` : ''}`}
                                                          className="text-[10px] text-gray-500 hover:text-[#1E3A8A] block transition-colors py-0.5"
                                                        >
                                                          • {subSub.name}
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
                                
                                {/* View All Link */}
                                <Link
                                  to={`/${petType.slug}`}
                                  className="text-xs font-semibold text-[#1E3A8A] hover:underline mt-3 pt-2 border-t border-gray-200 block"
                                >
                                  View All {petType.name} Products →
                                </Link>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                  
                {/* Today's Deals */}
                <li className="flex-shrink-0">
                  <Link to="/products?featured=true" className="flex items-center gap-0.5 lg:gap-1 bg-red-600 text-white px-1.5 lg:px-2.5 py-1 lg:py-1.5 rounded-full hover:bg-red-700 transition-colors shadow-md hover:shadow-lg font-bold whitespace-nowrap text-[10px] lg:text-xs">
                    <span className="text-[10px] lg:text-xs">🔥</span>
                    <span>Today's Deals</span>
                  </Link>
                </li>
                
                {/* Learning Center Dropdown */}
                <li className="relative group flex-shrink-0">
                  <Link 
                    to="/learning" 
                    className="flex items-center gap-0.5 lg:gap-1 hover:text-[#1E3A8A] transition-colors py-1.5 lg:py-2 px-1 lg:px-1.5 whitespace-nowrap"
                  >
                    <span className="text-xs lg:text-sm">Learning</span>
                    <ChevronDown size={14} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  
                  {/* Learning Center Dropdown Menu */}
                  <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-4 px-5 w-[90vw] max-w-[600px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Learning Center Column */}
                      <div className="space-y-2">
                        <Link
                          to="/learning"
                          className="font-bold text-sm text-gray-900 hover:text-[#1E3A8A] cursor-pointer transition-colors block mb-3"
                        >
                          Learning Center →
                        </Link>
                        <LearningCategories />
                      </div>
                      
                      {/* New Pet Column */}
                      <div className="space-y-2">
                        <h3 className="font-bold text-sm text-gray-900 mb-3">New Pet</h3>
                        <NewPetCategories />
                      </div>
                    </div>
                  </div>
                </li>
                
                {/* About */}
                <li className="flex-shrink-0">
                  <Link to="/about" className="hover:text-[#1E3A8A] transition-colors py-1.5 lg:py-2 px-1 lg:px-1.5 whitespace-nowrap text-xs lg:text-sm">
                    About
                  </Link>
                </li>
                  </ul>
                </div>
              </div>
            </div>
          </nav>

    {/* Mobile Menu - Fixed position for visibility at any scroll */}
    {mobileMenuOpen && (
      <>
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black/50 z-[45] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
        {/* Mobile Menu Panel */}
        <div className="fixed top-0 right-0 h-full w-[85vw] max-w-sm bg-white shadow-2xl z-[50] lg:hidden overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
            <h2 className="text-lg font-bold text-gray-900">Menu</h2>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close Menu"
            >
              <X size={24} className="text-gray-700" />
            </button>
          </div>
          <div className="px-4 py-4 overflow-x-hidden">
            {/* Search Bar in Mobile Menu */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (searchQuery.length >= 2) {
                      setShowSuggestions(true);
                    }
                  }}
                  className="w-full px-4 py-2.5 pr-12 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="Search"
                >
                  <Search size={20} />
                </button>
                <SearchSuggestions
                  query={searchQuery}
                  isOpen={showSuggestions}
                  onClose={() => setShowSuggestions(false)}
                  onSelect={(query) => {
                    setSearchQuery(query);
                    setShowSuggestions(false);
                    navigate(`/products?search=${encodeURIComponent(query)}`);
                  }}
                />
              </div>
            </form>
            <ul className="space-y-1 text-gray-700 overflow-x-hidden">
              {/* Dynamic Pet Types with Categories */}
              {petTypes.map((petType: any) => {
                const petCategories = getCategoriesForPetType(petType.slug);
                const isExpanded = expandedMobilePetTypes.has(petType.slug);
                const isSpecialDogMenu = petType.slug === 'dog';
                const isSpecialCatMenu = petType.slug === 'cat';
                const isSpecialOtherAnimalsMenu = petType.slug === 'other-animals';
                
                return (
                  <li key={petType.slug}>
                    {(petCategories.length > 0 || isSpecialDogMenu || isSpecialCatMenu || isSpecialOtherAnimalsMenu) ? (
                      // Pet type with categories - expandable
                      <>
                        <button
                          onClick={() => toggleMobilePetType(petType.slug)}
                          className="w-full flex items-center justify-between gap-3 py-3 px-3 font-semibold hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors overflow-hidden"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="text-xl flex-shrink-0">{petType.icon}</span>
                            <span className="truncate">{petType.name}</span>
                          </div>
                          <ChevronRight 
                            size={18} 
                            className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          />
                        </button>
                        
                        {/* Categories dropdown */}
                        {isExpanded && (
                          <div className="ml-6 mt-2 space-y-2 overflow-x-hidden max-w-full">
                            {isSpecialDogMenu ? (
                              // Special hardcoded Dog menu
                              <>
                                {dogMegaMenu.map((section: MenuSection) => (
                                  <div key={section._id || section.slug} className="space-y-1 mb-3">
                                    <Link
                                      to={`/category/${section.slug}?petType=dog`}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className="text-sm font-bold text-gray-900 px-3 block hover:text-[#1E3A8A] transition-colors"
                                    >
                                      {section.title} →
                                    </Link>
                                    <div className="space-y-1">
                                      {section.items.map((item: MenuItem | string) => (
                                        <Link
                                          key={typeof item === 'object' ? item.slug : String(item)}
                                          to={`/category/${typeof item === 'object' ? item.slug : encodeURIComponent(String(item).toLowerCase().replace(/\s+/g, '-'))}?petType=dog`}
                                          onClick={() => setMobileMenuOpen(false)}
                                          className="block py-1.5 px-3 text-xs text-gray-600 hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors truncate overflow-hidden"
                                        >
                                          {typeof item === 'object' ? item.name : item}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                                
                                {/* Special links */}
                                <div className="border-t pt-2 mt-2">
                                  {dogSpecialLinks.map((link, idx) => (
                                    <Link
                                      key={idx}
                                      to={`/dog`}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className="block py-2 px-3 text-sm font-semibold text-[#1E3A8A] hover:underline truncate overflow-hidden"
                                    >
                                      {link} →
                                    </Link>
                                  ))}
                                </div>
                              </>
                            ) : isSpecialCatMenu ? (
                              // Special hardcoded Cat menu
                              <>
                                {catMegaMenu.map((section: MenuSection) => (
                                  <div key={section._id || section.slug} className="space-y-1 mb-3">
                                    <Link
                                      to={`/category/${section.slug}?petType=cat`}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className="text-sm font-bold text-gray-900 px-3 block hover:text-[#1E3A8A] transition-colors"
                                    >
                                      {section.title} →
                                    </Link>
                                    <div className="space-y-1">
                                      {section.items.map((item: MenuItem | string) => (
                                        <Link
                                          key={typeof item === 'object' ? item.slug : String(item)}
                                          to={`/category/${typeof item === 'object' ? item.slug : encodeURIComponent(String(item).toLowerCase().replace(/\s+/g, '-'))}?petType=cat`}
                                          onClick={() => setMobileMenuOpen(false)}
                                          className="block py-1.5 px-3 text-xs text-gray-600 hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors truncate overflow-hidden"
                                        >
                                          {typeof item === 'object' ? item.name : item}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                                
                                {/* Special links */}
                                <div className="border-t pt-2 mt-2">
                                  {catSpecialLinks.map((link, idx) => (
                                    <Link
                                      key={idx}
                                      to={`/cat`}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className="block py-2 px-3 text-sm font-semibold text-[#1E3A8A] hover:underline truncate overflow-hidden"
                                    >
                                      {link} →
                                    </Link>
                                  ))}
                                </div>
                              </>
                            ) : isSpecialOtherAnimalsMenu ? (
                              // Special hardcoded Other Animals menu
                              <>
                                {otherAnimalsMegaMenu.map((section: MenuSection) => (
                                  <div key={section._id || section.slug} className="space-y-1 mb-3">
                                    <Link
                                      to={`/category/${section.slug}?petType=other-animals`}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className="text-sm font-bold text-gray-900 px-3 block hover:text-[#1E3A8A] transition-colors"
                                    >
                                      {section.title} →
                                    </Link>
                                    <div className="space-y-1">
                                      {section.items.map((item: MenuItem | string) => (
                                        <Link
                                          key={typeof item === 'object' ? item.slug : String(item)}
                                          to={`/category/${typeof item === 'object' ? item.slug : encodeURIComponent(String(item).toLowerCase().replace(/\s+/g, '-'))}?petType=other-animals`}
                                          onClick={() => setMobileMenuOpen(false)}
                                          className="block py-1.5 px-3 text-xs text-gray-600 hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors truncate overflow-hidden"
                                        >
                                          {typeof item === 'object' ? item.name : item}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </>
                            ) : (
                              // Standard display for other pet types - with all subcategory levels
                              <>
                                {petCategories.map((category: any) => {
                                  const subcategories = getSubcategories(category._id);
                                  
                                  return (
                                    <div key={category._id} className="space-y-1">
                                      <Link
                                        to={`/category/${category.slug}${category.petType && category.petType !== 'all' ? `?petType=${category.petType}` : ''}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-2 px-3 text-sm font-semibold text-gray-900 hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors truncate overflow-hidden"
                                      >
                                        {category.name}
                                      </Link>
                                      
                                      {subcategories.length > 0 && (
                                        <div className="ml-4 space-y-1">
                                          {subcategories.map((sub: any) => {
                                            const subSubcategories = getSubcategories(sub._id);
                                            
                                            return (
                                              <div key={sub._id} className="space-y-1">
                                                <Link
                                                  to={`/category/${sub.slug}${sub.petType && sub.petType !== 'all' ? `?petType=${sub.petType}` : ''}`}
                                                  onClick={() => setMobileMenuOpen(false)}
                                                  className="block py-1.5 px-3 text-sm text-gray-600 hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors font-medium truncate overflow-hidden"
                                                >
                                                  {sub.name}
                                                </Link>
                                                
                                                {/* 3rd Level Subcategories */}
                                                {subSubcategories.length > 0 && (
                                                  <div className="ml-4 space-y-1">
                                                    {subSubcategories.map((subSub: any) => (
                                                      <Link
                                                        key={subSub._id}
                                                        to={`/category/${subSub.slug}${subSub.petType && subSub.petType !== 'all' ? `?petType=${subSub.petType}` : ''}`}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className="block py-1 px-3 text-xs text-gray-500 hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors truncate overflow-hidden"
                                                      >
                                                        • {subSub.name}
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
                                
                                {/* View All */}
                                <Link
                                  to={`/${petType.slug}`}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="block py-2 px-3 text-sm font-semibold text-[#1E3A8A] hover:underline truncate overflow-hidden"
                                >
                                  View All {petType.name} Products →
                                </Link>
                              </>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      // Pet type without categories - direct link
                      <Link
                        to={`/${petType.slug}`}
                        className="flex items-center gap-3 py-3 px-3 font-semibold hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors overflow-hidden"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="text-xl flex-shrink-0">{petType.icon}</span>
                        <span className="truncate">{petType.name}</span>
                      </Link>
                    )}
                  </li>
                );
              })}
              
              {/* Today's Deals */}
              <li>
                <Link
                  to="/products?featured=true"
                  className="flex items-center gap-3 py-3 px-3 font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-xl">🔥</span>
                  <span>Today's Deals</span>
                </Link>
              </li>
              {/* Learning Center */}
              <li>
                <Link
                  to="/learning"
                  className="flex items-center gap-3 py-3 px-3 font-semibold hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-xl">📚</span>
                  <span>Learning</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="flex items-center gap-3 py-3 px-3 font-semibold hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-xl">💊</span>
                  <span>Pharmacy</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="flex items-center gap-3 py-3 px-3 font-semibold hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-xl">ℹ️</span>
                  <span>About Us</span>
                </Link>
              </li>
              {isAuthenticated ? (
                <>
                  <li>
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 py-3 px-3 font-semibold hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User size={20} />
                      <span>My Profile</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/favorites"
                      className="flex items-center gap-3 py-3 px-3 font-semibold hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Heart size={20} className="text-pink-500" fill="currentColor" />
                      <span>My Favorites</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/orders"
                      className="flex items-center gap-3 py-3 px-3 font-semibold hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <ShoppingCart size={20} />
                      <span>My Orders</span>
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setShowLogoutModal(true);
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full text-left py-3 px-3 font-semibold hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                    >
                      <span className="text-xl">🚪</span>
                      <span>Logout</span>
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    to="/login"
                    className="flex items-center gap-3 py-3 px-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User size={20} />
                    <span>Sign In / Register</span>
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </>
      )}

    {/* Left Sidebar for Desktop Navigation (when scrolled) - Hidden on Mobile */}
    {isLeftSidebarOpen && (
      <>
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black/50 z-50 lg:block hidden"
          onClick={() => setIsLeftSidebarOpen(false)}
        />
        {/* Sidebar */}
        <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out overflow-y-auto">
          <div className="p-6">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Shop by Category</h2>
              <button
                onClick={() => setIsLeftSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close Menu"
              >
                <X size={24} className="text-gray-700" />
              </button>
            </div>

            {/* Navigation Items */}
            <ul className="space-y-1">
              {petTypes.map((petType: any) => {
                const petCategories = getCategoriesForPetType(petType.slug);
                const isExpanded = expandedMobilePetTypes.has(petType.slug);
                const isSpecialDogMenu = petType.slug === 'dog';
                const isSpecialCatMenu = petType.slug === 'cat';
                const isSpecialOtherAnimalsMenu = petType.slug === 'other-animals';

                return (
                  <li key={petType.slug}>
                    {(petCategories.length > 0 || isSpecialDogMenu || isSpecialCatMenu || isSpecialOtherAnimalsMenu) ? (
                      <>
                        <button
                          onClick={() => toggleMobilePetType(petType.slug)}
                          className="w-full flex items-center justify-between gap-3 py-3 px-4 font-semibold hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{petType.icon}</span>
                            <span>{petType.name}</span>
                          </div>
                          <ChevronRight 
                            size={18} 
                            className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          />
                        </button>

                        {/* Categories dropdown */}
                        {isExpanded && (
                          <div className="ml-6 mt-2 space-y-2">
                            {isSpecialDogMenu ? (
                              <>
                                {dogMegaMenu.map((section: MenuSection) => (
                                  <div key={section._id || section.slug} className="space-y-1 mb-3">
                                    <Link
                                      to={`/category/${section.slug}?petType=dog`}
                                      onClick={() => setIsLeftSidebarOpen(false)}
                                      className="text-sm font-bold text-gray-900 px-3 block hover:text-[#1E3A8A] transition-colors"
                                    >
                                      {section.title} →
                                    </Link>
                                    <div className="space-y-1">
                                      {section.items.map((item: MenuItem | string) => (
                                        <Link
                                          key={typeof item === 'object' ? item.slug : String(item)}
                                          to={`/category/${typeof item === 'object' ? item.slug : encodeURIComponent(String(item).toLowerCase().replace(/\s+/g, '-'))}?petType=dog`}
                                          onClick={() => setIsLeftSidebarOpen(false)}
                                          className="block py-1.5 px-3 text-xs text-gray-600 hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors"
                                        >
                                          {typeof item === 'object' ? item.name : item}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </>
                            ) : isSpecialCatMenu ? (
                              <>
                                {catMegaMenu.map((section: MenuSection) => (
                                  <div key={section._id || section.slug} className="space-y-1 mb-3">
                                    <Link
                                      to={`/category/${section.slug}?petType=cat`}
                                      onClick={() => setIsLeftSidebarOpen(false)}
                                      className="text-sm font-bold text-gray-900 px-3 block hover:text-[#1E3A8A] transition-colors"
                                    >
                                      {section.title} →
                                    </Link>
                                    <div className="space-y-1">
                                      {section.items.map((item: MenuItem | string) => (
                                        <Link
                                          key={typeof item === 'object' ? item.slug : String(item)}
                                          to={`/category/${typeof item === 'object' ? item.slug : encodeURIComponent(String(item).toLowerCase().replace(/\s+/g, '-'))}?petType=cat`}
                                          onClick={() => setIsLeftSidebarOpen(false)}
                                          className="block py-1.5 px-3 text-xs text-gray-600 hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors"
                                        >
                                          {typeof item === 'object' ? item.name : item}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </>
                            ) : isSpecialOtherAnimalsMenu ? (
                              <>
                                {otherAnimalsMegaMenu.map((section: MenuSection) => (
                                  <div key={section._id || section.slug} className="space-y-1 mb-3">
                                    <Link
                                      to={`/category/${section.slug}?petType=other-animals`}
                                      onClick={() => setIsLeftSidebarOpen(false)}
                                      className="text-sm font-bold text-gray-900 px-3 block hover:text-[#1E3A8A] transition-colors"
                                    >
                                      {section.title} →
                                    </Link>
                                    <div className="space-y-1">
                                      {section.items.map((item: MenuItem | string) => (
                                        <Link
                                          key={typeof item === 'object' ? item.slug : String(item)}
                                          to={`/category/${typeof item === 'object' ? item.slug : encodeURIComponent(String(item).toLowerCase().replace(/\s+/g, '-'))}?petType=other-animals`}
                                          onClick={() => setIsLeftSidebarOpen(false)}
                                          className="block py-1.5 px-3 text-xs text-gray-600 hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors"
                                        >
                                          {typeof item === 'object' ? item.name : item}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </>
                            ) : (
                              petCategories.map((category: any) => {
                                const subcategories = getSubcategories(category._id);
                                return (
                                  <div key={category._id} className="space-y-1">
                                    <Link
                                      to={`/category/${category.slug}${category.petType && category.petType !== 'all' ? `?petType=${category.petType}` : ''}`}
                                      onClick={() => setIsLeftSidebarOpen(false)}
                                      className="block py-2 px-3 font-semibold text-gray-900 hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors"
                                    >
                                      {category.name}
                                    </Link>
                                    {subcategories.length > 0 && (
                                      <div className="ml-3 space-y-1">
                                        {subcategories.map((sub: any) => (
                                          <Link
                                            key={sub._id}
                                            to={`/category/${sub.slug}${sub.petType && sub.petType !== 'all' ? `?petType=${sub.petType}` : ''}`}
                                            onClick={() => setIsLeftSidebarOpen(false)}
                                            className="block py-1.5 px-3 text-sm text-gray-600 hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors"
                                          >
                                            {sub.name}
                                          </Link>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        to={`/${petType.slug}`}
                        onClick={() => setIsLeftSidebarOpen(false)}
                        className="flex items-center gap-3 py-3 px-4 font-semibold hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors"
                      >
                        <span className="text-xl">{petType.icon}</span>
                        <span>{petType.name}</span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Additional Links */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link
                to="/products?featured=true"
                onClick={() => setIsLeftSidebarOpen(false)}
                className="flex items-center gap-3 py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold mb-3"
              >
                <span>🔥</span>
                <span>Today's Deals</span>
              </Link>
              <Link
                to="/about"
                onClick={() => setIsLeftSidebarOpen(false)}
                className="block py-3 px-4 font-semibold hover:bg-blue-50 hover:text-[#1E3A8A] rounded-lg transition-colors"
              >
                About
              </Link>
            </div>
          </div>
        </div>
      </>
    )}

    {/* Logout Confirmation Modal */}
    <ConfirmationModal
      isOpen={showLogoutModal}
      onClose={() => setShowLogoutModal(false)}
      onConfirm={handleLogout}
      title="Confirm Logout"
      message="Are you sure you want to log out? You'll need to sign in again to access your account."
      confirmText="Logout"
      cancelText="Stay Logged In"
      confirmButtonClass="bg-red-600 hover:bg-red-700"
      icon={
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <LogOut className="text-red-600" size={32} />
        </div>
      }
    />

    {/* Toast Notification */}
    {toast.isVisible && (
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    )}
    </>
  );
};

export default Header;



