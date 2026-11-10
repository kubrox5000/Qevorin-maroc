import React from 'react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { ShoppingBag, Star, Zap, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { language, addToCart, quickBuy, setSelectedProductId, setCurrentView } = useStore();
  const isAr = language === 'ar';

  const discountPercent = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const handleCardClick = () => {
    setSelectedProductId(product.id);
    setCurrentView('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
  };

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    quickBuy(product);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group cursor-pointer rounded-2xl bg-white border border-stone-200/90 overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
    >
      {/* Product Image Area */}
      <div className="relative aspect-4/3 w-full bg-stone-100 overflow-hidden">
        <img
          src={product.images[0] || '/src/assets/images/hero_qevorin_lifestyle_1793906502999.jpg'}
          alt={isAr ? product.title : product.titleFr}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Subtle Discount / Badge Overlay */}
        <div className="absolute top-3 start-3 flex flex-col gap-1.5 pointer-events-none">
          {discountPercent > 0 && (
            <span className="bg-amber-600 text-white font-bold text-[11px] px-2 py-0.5 rounded-md shadow-xs">
              {isAr ? `تخفيض ${discountPercent}%-` : `-${discountPercent}%`}
            </span>
          )}
          {product.badge === 'bestseller' && (
            <span className="bg-stone-900 text-white font-medium text-[10px] px-2 py-0.5 rounded-md shadow-xs">
              {isAr ? 'الأكثر طلباً' : 'Best-Seller'}
            </span>
          )}
          {product.badge === 'new' && (
            <span className="bg-emerald-700 text-white font-medium text-[10px] px-2 py-0.5 rounded-md shadow-xs">
              {isAr ? 'وصل حديثاً' : 'Nouveau'}
            </span>
          )}
        </div>

        {/* Quick View Floating Button on Desktop Hover */}
        <div className="absolute inset-x-3 bottom-3 hidden group-hover:flex items-center justify-center gap-2 transition-all">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className="w-full py-2 px-3 rounded-xl bg-white/95 backdrop-blur-xs text-stone-900 text-xs font-semibold shadow-md hover:bg-stone-900 hover:text-white transition-colors flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isAr ? 'عرض التفاصيل' : 'Aperçu'}</span>
          </button>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex flex-col grow justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
            <span className="truncate">{isAr ? product.categoryName : product.categoryNameFr}</span>
            <div className="flex items-center gap-1 text-amber-500 font-medium">
              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
              <span className="tabular-nums text-[11px]">{product.rating.toFixed(1)}</span>
              <span className="text-stone-400 text-[10px]">({product.reviewCount})</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-stone-900 text-sm line-clamp-2 leading-snug group-hover:text-amber-700 transition-colors mb-2">
            {isAr ? product.title : product.titleFr}
          </h3>
        </div>

        {/* Pricing & Moroccan Dirham Tag */}
        <div className="mt-2 pt-2 border-t border-stone-100">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg font-bold text-stone-950 tabular-nums">
              {product.price} <span className="text-xs font-semibold">{isAr ? 'درهم' : 'MAD'}</span>
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-stone-400 line-through tabular-nums">
                {product.compareAtPrice} {isAr ? 'د.م' : 'MAD'}
              </span>
            )}
          </div>

          {/* Action Buttons: Add to Cart & Buy Now (COD) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAddToCart}
              className="py-2 px-2.5 rounded-xl border border-stone-300 text-stone-800 text-xs font-medium hover:bg-stone-100 hover:border-stone-400 transition-colors flex items-center justify-center gap-1"
              title={isAr ? 'إضافة إلى السلة' : 'Ajouter au panier'}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-stone-600" />
              <span className="truncate">{isAr ? 'أضف للسلة' : 'Panier'}</span>
            </button>

            <button
              onClick={handleQuickBuy}
              className="py-2 px-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1"
              title={isAr ? 'شراء فوري – الدفع عند الاستلام' : 'Acheter maintenant'}
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="truncate">{isAr ? 'شراء سريع' : 'Acheter'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
