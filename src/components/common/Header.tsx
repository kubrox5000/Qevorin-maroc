import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ShoppingBag, Search, ShieldCheck, Languages, Menu, X, ArrowRight, Truck } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    language,
    toggleLanguage,
    cartTotalQuantity,
    setIsCartOpen,
    currentView,
    setCurrentView,
    setSelectedCategoryId,
    searchQuery,
    setSearchQuery,
    setSelectedProductId,
    storeSettings,
  } = useStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);

  const isAr = language === 'ar';

  const handleNavClick = (view: 'home' | 'category' | 'admin', categoryId?: string) => {
    setSelectedProductId(null);
    if (categoryId) {
      setSelectedCategoryId(categoryId);
      setCurrentView('category');
    } else {
      setSelectedCategoryId(null);
      setCurrentView(view);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-stone-200">
      {/* Moroccan Shipping & COD Announcement Bar */}
      <div className="bg-stone-900 text-stone-200 text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-medium">
              {isAr
                ? `توصيل مجاني للطلبات فوق ${storeSettings.freeShippingThreshold} درهم · الدفع عند الاستلام لجميع مدن المغرب`
                : `Livraison gratuite dès ${storeSettings.freeShippingThreshold} MAD · Paiement à la livraison au Maroc`}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-stone-400 text-[11px]">
            <span>{isAr ? 'واتساب الدعم: ' : 'WhatsApp SAV: '} {storeSettings.storeWhatsApp}</span>
            <span aria-hidden="true">·</span>
            <span>{isAr ? 'ضمان استرجاع 7 أيام' : 'Retour garanti 7 jours'}</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-18">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleNavClick('home')}
              className="group flex items-center gap-2.5 text-start cursor-pointer focus:outline-none"
            >
              <div className="w-9 h-9 rounded-lg bg-stone-900 flex items-center justify-center text-amber-400 font-bold text-lg shadow-sm group-hover:bg-amber-600 transition-colors">
                Q
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-stone-950 font-serif leading-none">
                  QEVORIN
                </span>
                <span className="text-[10px] font-medium tracking-widest text-stone-500 uppercase mt-0.5">
                  {isAr ? 'كيفورين المغرب' : 'Morocco Store'}
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: 4-5 Clean Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-stone-700">
            <button
              onClick={() => handleNavClick('home')}
              className={`hover:text-stone-950 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                currentView === 'home' ? 'border-amber-500 text-stone-950 font-semibold' : 'border-transparent'
              }`}
            >
              {isAr ? 'الرئيسية' : 'Accueil'}
            </button>

            <button
              onClick={() => handleNavClick('category', 'electronics')}
              className="hover:text-stone-950 transition-colors whitespace-nowrap shrink-0 py-1 text-stone-600 hover:border-b-2 hover:border-amber-400"
            >
              {isAr ? 'إلكترونيات' : 'Électronique'}
            </button>

            <button
              onClick={() => handleNavClick('category', 'home-kitchen')}
              className="hover:text-stone-950 transition-colors whitespace-nowrap shrink-0 py-1 text-stone-600 hover:border-b-2 hover:border-amber-400"
            >
              {isAr ? 'المنزل والمطبخ' : 'Maison'}
            </button>

            <button
              onClick={() => handleNavClick('category', 'beauty')}
              className="hover:text-stone-950 transition-colors whitespace-nowrap shrink-0 py-1 text-stone-600 hover:border-b-2 hover:border-amber-400"
            >
              {isAr ? 'العناية والتجميل' : 'Beauté'}
            </button>

            <button
              onClick={() => handleNavClick('category', 'fashion')}
              className="hover:text-stone-950 transition-colors whitespace-nowrap shrink-0 py-1 text-stone-600 hover:border-b-2 hover:border-amber-400"
            >
              {isAr ? 'الأزياء والموضة' : 'Mode'}
            </button>
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            {/* Search Input on Desktop */}
            <div className="relative hidden md:block w-48 lg:w-60">
              <input
                type="text"
                placeholder={isAr ? 'ابحث عن منتج، علامة...' : 'Rechercher un produit...'}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (currentView !== 'home' && currentView !== 'category') {
                    setCurrentView('home');
                  }
                }}
                className="w-full text-xs rounded-lg border border-stone-200 bg-stone-50 py-2 ps-8 pe-3 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-900 focus:outline-none transition-colors"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute top-2.5 start-2.5 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute top-2 end-2 text-stone-400 hover:text-stone-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchActive(!isSearchActive)}
              className="md:hidden p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Language Switcher (AR / FR) */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:text-stone-950 hover:bg-stone-100 text-xs font-medium transition-colors"
              title={isAr ? 'Passer en Français' : 'التحويل إلى العربية'}
            >
              <Languages className="w-3.5 h-3.5 text-stone-500" />
              <span>{isAr ? 'Français' : 'العربية'}</span>
            </button>

            {/* Admin Dashboard Access Button */}
            <button
              onClick={() => handleNavClick('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentView === 'admin'
                  ? 'bg-amber-600 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'لوحة التحكم' : 'Admin'}</span>
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center justify-center p-2.5 rounded-xl bg-stone-900 text-stone-50 hover:bg-stone-800 transition-colors shadow-xs"
              aria-label="Cart"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              {cartTotalQuantity > 0 && (
                <span className="absolute -top-1.5 -end-1.5 bg-amber-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center tabular-nums shadow-sm animate-in zoom-in-50">
                  {cartTotalQuantity}
                </span>
              )}
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-stone-700 hover:bg-stone-100 focus:outline-none"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Dropdown */}
        {isSearchActive && (
          <div className="md:hidden py-3 border-t border-stone-100">
            <div className="relative">
              <input
                type="text"
                placeholder={isAr ? 'ابحث في كل المنتجات...' : 'Rechercher un produit...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full text-sm rounded-lg border border-stone-300 bg-stone-50 py-2.5 ps-9 pe-3 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-900 focus:outline-none"
              />
              <Search className="w-4 h-4 text-stone-400 absolute top-3 start-3" />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-30 z-50 bg-white border-t border-stone-200 overflow-y-auto p-6 animate-in slide-in-from-top-4">
          <div className="space-y-4">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              {isAr ? 'التصنيفات الرئيسية' : 'Catégories'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleNavClick('category', 'electronics')}
                className="p-3 text-start rounded-lg bg-stone-50 hover:bg-stone-100 font-medium text-sm text-stone-800"
              >
                {isAr ? 'إلكترونيات' : 'Électronique'}
              </button>
              <button
                onClick={() => handleNavClick('category', 'home-kitchen')}
                className="p-3 text-start rounded-lg bg-stone-50 hover:bg-stone-100 font-medium text-sm text-stone-800"
              >
                {isAr ? 'المنزل والمطبخ' : 'Maison & Cuisine'}
              </button>
              <button
                onClick={() => handleNavClick('category', 'beauty')}
                className="p-3 text-start rounded-lg bg-stone-50 hover:bg-stone-100 font-medium text-sm text-stone-800"
              >
                {isAr ? 'العناية والتجميل' : 'Beauté & Soins'}
              </button>
              <button
                onClick={() => handleNavClick('category', 'fashion')}
                className="p-3 text-start rounded-lg bg-stone-50 hover:bg-stone-100 font-medium text-sm text-stone-800"
              >
                {isAr ? 'الأزياء والموضة' : 'Mode & Style'}
              </button>
              <button
                onClick={() => handleNavClick('category', 'accessories')}
                className="p-3 text-start rounded-lg bg-stone-50 hover:bg-stone-100 font-medium text-sm text-stone-800"
              >
                {isAr ? 'إكسسوارات' : 'Accessoires'}
              </button>
              <button
                onClick={() => handleNavClick('category', 'automotive')}
                className="p-3 text-start rounded-lg bg-stone-50 hover:bg-stone-100 font-medium text-sm text-stone-800"
              >
                {isAr ? 'مستلزمات السيارات' : 'Automobile'}
              </button>
              <button
                onClick={() => handleNavClick('category', 'sports')}
                className="p-3 text-start rounded-lg bg-stone-50 hover:bg-stone-100 font-medium text-sm text-stone-800"
              >
                {isAr ? 'الرياضة واللياقة' : 'Sports & Fitness'}
              </button>
              <button
                onClick={() => handleNavClick('category', 'pets')}
                className="p-3 text-start rounded-lg bg-stone-50 hover:bg-stone-100 font-medium text-sm text-stone-800"
              >
                {isAr ? 'الحيوانات الأليفة' : 'Animalerie'}
              </button>
            </div>

            <div className="pt-4 border-t border-stone-200 flex flex-col gap-3">
              <button
                onClick={() => handleNavClick('admin')}
                className="w-full py-3 px-4 rounded-xl bg-stone-900 text-white font-medium text-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? 'لوحة إدارة المتجر' : 'Administration Store'}</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
