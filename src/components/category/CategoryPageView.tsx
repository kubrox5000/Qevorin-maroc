import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from '../product/ProductCard';
import {
  Smartphone,
  Coffee,
  Sparkles,
  Shirt,
  Watch,
  Car,
  Activity,
  HeartHandshake,
  SlidersHorizontal,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Smartphone: <Smartphone className="w-5 h-5" />,
  Coffee: <Coffee className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  Shirt: <Shirt className="w-5 h-5" />,
  Watch: <Watch className="w-5 h-5" />,
  Car: <Car className="w-5 h-5" />,
  Activity: <Activity className="w-5 h-5" />,
  HeartHandshake: <HeartHandshake className="w-5 h-5" />,
};

export const CategoryPageView: React.FC = () => {
  const {
    categories,
    products,
    selectedCategoryId,
    setSelectedCategoryId,
    setCurrentView,
    language,
    searchQuery,
    setSearchQuery,
  } = useStore();

  const isAr = language === 'ar';
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'rating'>('default');

  const currentCategory = categories.find((c) => c.id === selectedCategoryId);

  // Filter products
  let filtered = products.filter((p) => {
    if (!p.isPublished) return false;
    if (selectedCategoryId && p.categoryId !== selectedCategoryId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.titleFr.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sort products
  if (sortBy === 'price-asc') {
    filtered = [...filtered].sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
    filtered = [...filtered].sort((a, b) => b.price - a.price);
  } else if (sortBy === 'rating') {
    filtered = [...filtered].sort((a, b) => b.rating - a.rating);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-stone-500 mb-6">
        <button
          onClick={() => setCurrentView('home')}
          className="hover:text-stone-900 transition-colors"
        >
          {isAr ? 'الرئيسية' : 'Accueil'}
        </button>
        <span>/</span>
        <span className="text-stone-900 font-medium">
          {currentCategory
            ? isAr
              ? currentCategory.name
              : currentCategory.nameFr
            : isAr
            ? 'كل الأقسام'
            : 'Toutes les catégories'}
        </span>
      </div>

      {/* Category Header Banner */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-10 mb-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center">
              {currentCategory ? iconMap[currentCategory.icon] || <Sparkles className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif">
              {currentCategory
                ? isAr
                  ? currentCategory.name
                  : currentCategory.nameFr
                : isAr
                ? 'جميع منتجات متجر كيفورين'
                : 'Tous nos Produits'}
            </h1>
          </div>
          <p className="text-stone-300 text-xs sm:text-sm leading-relaxed mb-4">
            {currentCategory
              ? isAr
                ? currentCategory.description
                : currentCategory.descriptionFr
              : isAr
              ? 'تصفح تشكيلة واسعة من الإلكترونيات، العناية، المنزل ومستلزمات السيارات مع الدفع عند الاستلام.'
              : 'Découvrez notre collection complète avec paiement sécurisé à la livraison partout au Maroc.'}
          </p>
          <div className="text-xs text-amber-400 font-medium">
            {filtered.length} {isAr ? 'منتج متاح للشحن الفوري بالمغرب' : 'produits disponibles'}
          </div>
        </div>
      </div>

      {/* Category Pill Switcher Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
        <button
          onClick={() => setSelectedCategoryId(null)}
          className={`py-2 px-4 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
            selectedCategoryId === null
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          {isAr ? 'الكل' : 'Tous'}
        </button>
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`py-2 px-4 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors flex items-center gap-2 ${
                isSelected
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <span>{isAr ? cat.name : cat.nameFr}</span>
              <span className="text-[10px] opacity-75">({cat.productCount})</span>
            </button>
          );
        })}
      </div>

      {/* Controls Bar: Search feedback & Sort */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="text-xs text-stone-600">
          {searchQuery && (
            <span>
              {isAr ? `تصفية البحث: "${searchQuery}"` : `Filtré par: "${searchQuery}"`}
              <button
                onClick={() => setSearchQuery('')}
                className="ms-2 text-rose-600 underline font-medium"
              >
                {isAr ? 'مسح' : 'Effacer'}
              </button>
            </span>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'default' | 'price-asc' | 'price-desc' | 'rating')}
            className="text-xs bg-white border border-stone-200 rounded-xl py-1.5 px-3 text-stone-800 focus:outline-none focus:border-stone-900 cursor-pointer"
          >
            <option value="default">{isAr ? 'الترتيب: الافتراضي' : 'Tri : Par défaut'}</option>
            <option value="price-asc">{isAr ? 'السعر: من الأقل إلى الأعلى' : 'Prix : Croissant'}</option>
            <option value="price-desc">{isAr ? 'السعر: من الأعلى إلى الأقل' : 'Prix : Décroissant'}</option>
            <option value="rating">{isAr ? 'التقييم: الأعلى تقييماً' : 'Mieux notés'}</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center rounded-3xl bg-white border border-stone-200 p-8 space-y-4">
          <p className="text-sm font-semibold text-stone-800">
            {isAr ? 'لا توجد منتجات مطابقة في هذا القسم حالياً' : 'Aucun produit trouvé'}
          </p>
          <button
            onClick={() => {
              setSelectedCategoryId(null);
              setSearchQuery('');
            }}
            className="py-2.5 px-5 rounded-xl bg-stone-900 text-white text-xs font-semibold"
          >
            {isAr ? 'إعادة ضبط واستعراض الكل' : 'Voir tout le catalogue'}
          </button>
        </div>
      )}
    </div>
  );
};
