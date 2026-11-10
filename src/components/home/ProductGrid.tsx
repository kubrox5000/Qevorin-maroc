import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from '../product/ProductCard';
import { Sparkles, TrendingUp, Clock, Grid } from 'lucide-react';

export const ProductGrid: React.FC = () => {
  const { products, language, searchQuery, selectedCategoryId } = useStore();
  const [activeTab, setActiveTab] = useState<'all' | 'featured' | 'bestseller' | 'new'>('all');
  const isAr = language === 'ar';

  // Filter products by category, search query, and tab
  const filteredProducts = products.filter((prod) => {
    if (!prod.isPublished) return false;

    if (selectedCategoryId && prod.categoryId !== selectedCategoryId) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = prod.title.toLowerCase().includes(q) || prod.titleFr.toLowerCase().includes(q);
      const matchDesc = prod.description.toLowerCase().includes(q) || prod.descriptionFr.toLowerCase().includes(q);
      const matchCat = prod.categoryName.toLowerCase().includes(q) || prod.categoryNameFr.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }

    if (activeTab === 'featured') return prod.badge === 'featured' || prod.rating >= 4.8;
    if (activeTab === 'bestseller') return prod.badge === 'bestseller';
    if (activeTab === 'new') return prod.badge === 'new';

    return true;
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold font-serif text-stone-900">
            {searchQuery
              ? isAr
                ? `نتائج البحث عن "${searchQuery}"`
                : `Résultats pour "${searchQuery}"`
              : isAr
              ? 'تشكيلة المنتجات المختارة'
              : 'Notre Sélection Shopping'}
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            {isAr
              ? `${filteredProducts.length} منتج متوفر مع الدفع عند الاستلام والتوصيل السريع`
              : `${filteredProducts.length} articles disponibles pour livraison au Maroc`}
          </p>
        </div>

        {/* Clean Segmented Filter Controls */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl border border-stone-200 self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-white text-stone-950 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>{isAr ? 'كل المنتجات' : 'Tous'}</span>
          </button>

          <button
            onClick={() => setActiveTab('featured')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'featured'
                ? 'bg-white text-stone-950 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{isAr ? 'عروض مميزة' : 'En Vedette'}</span>
          </button>

          <button
            onClick={() => setActiveTab('bestseller')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'bestseller'
                ? 'bg-white text-stone-950 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            <span>{isAr ? 'الأكثر طلباً' : 'Best-Sellers'}</span>
          </button>

          <button
            onClick={() => setActiveTab('new')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'new'
                ? 'bg-white text-stone-950 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isAr ? 'وصل حديثاً' : 'Nouveautés'}</span>
          </button>
        </div>
      </div>

      {/* Product Cards Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-2xl border border-dashed border-stone-300 bg-white p-8">
          <p className="text-sm font-medium text-stone-600 mb-2">
            {isAr ? 'لم يتم العثور على أي منتج يطابق هذا الاختيار' : 'Aucun produit trouvé pour cette sélection'}
          </p>
          <p className="text-xs text-stone-400">
            {isAr ? 'جرب البحث بكلمات أخرى أو اختر قسماً آخر' : 'Essayez d’élargir vos critères de recherche'}
          </p>
        </div>
      )}
    </section>
  );
};
