import React from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Smartphone,
  Coffee,
  Sparkles,
  Shirt,
  Watch,
  Car,
  Activity,
  HeartHandshake,
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

export const CategorySlider: React.FC = () => {
  const { categories, language, selectedCategoryId, setSelectedCategoryId, setCurrentView } = useStore();
  const isAr = language === 'ar';

  const handleSelectCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    setCurrentView('category');
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900">
            {isAr ? 'تصفح حسب الأقسام' : 'Nos Catégories'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            {isAr ? 'اختر القسم الذي يناسب اهتمامك واستكشف أفضل المنتجات' : 'Explorez notre gamme complète par univers'}
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedCategoryId(null);
            setCurrentView('category');
          }}
          className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 transition-colors"
        >
          <span>{isAr ? 'عرض الكل' : 'Voir tout'}</span>
          {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Grid of 8 Categories */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              className={`p-4 rounded-2xl flex flex-col items-center text-center transition-all duration-200 border cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-md font-bold'
                  : 'bg-white text-stone-800 border-stone-200 hover:border-amber-400 hover:bg-stone-50/80 hover:-translate-y-0.5'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                  isSelected ? 'bg-stone-950 text-amber-400' : 'bg-stone-100 text-stone-700 group-hover:text-amber-600'
                }`}
              >
                {iconMap[cat.icon] || <Sparkles className="w-5 h-5" />}
              </div>
              <span className="text-xs font-bold leading-tight line-clamp-1 mb-1">
                {isAr ? cat.name : cat.nameFr}
              </span>
              <span className={`text-[11px] ${isSelected ? 'text-stone-900' : 'text-stone-400'}`}>
                {cat.productCount} {isAr ? 'منتج' : 'prod.'}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
