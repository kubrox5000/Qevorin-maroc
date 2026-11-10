import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from './ProductCard';
import {
  Star,
  ShoppingBag,
  Zap,
  Truck,
  ShieldCheck,
  RotateCcw,
  Play,
  ArrowRight,
  ArrowLeft,
  Check,
  Minus,
  Plus,
} from 'lucide-react';

export const ProductDetailView: React.FC = () => {
  const {
    products,
    selectedProductId,
    setSelectedProductId,
    setCurrentView,
    addToCart,
    quickBuy,
    language,
    storeSettings,
  } = useStore();

  const isAr = language === 'ar';

  const product = products.find((p) => p.id === selectedProductId) || products[0];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product?.variants[0]?.id || ''
  );
  const [quantity, setQuantity] = useState(1);
  const [activeMediaTab, setActiveMediaTab] = useState<'photos' | 'video'>('photos');

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-stone-600 mb-4">{isAr ? 'المنتج غير موجود' : 'Produit introuvable'}</p>
        <button
          onClick={() => setCurrentView('home')}
          className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-sm"
        >
          {isAr ? 'العودة للرئيسية' : 'Retour à l’accueil'}
        </button>
      </div>
    );
  }

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  const activePrice = selectedVariant ? selectedVariant.price : product.price;
  const comparePrice = selectedVariant?.compareAtPrice || product.compareAtPrice;
  const savings = comparePrice && comparePrice > activePrice ? comparePrice - activePrice : 0;

  // Related products from same category
  const relatedProducts = products
    .filter((p) => p.id !== product.id && p.categoryId === product.categoryId)
    .slice(0, 4);

  const handleAddToCart = () => {
    addToCart(product, selectedVariant?.id, quantity);
  };

  const handleBuyNow = () => {
    quickBuy(product, selectedVariant?.id, quantity);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-stone-500 mb-6">
        <button
          onClick={() => {
            setSelectedProductId(null);
            setCurrentView('home');
          }}
          className="hover:text-stone-900 transition-colors"
        >
          {isAr ? 'الرئيسية' : 'Accueil'}
        </button>
        <span>/</span>
        <button
          onClick={() => {
            setSelectedProductId(null);
            setCurrentView('category');
          }}
          className="hover:text-stone-900 transition-colors"
        >
          {isAr ? product.categoryName : product.categoryNameFr}
        </button>
        <span>/</span>
        <span className="text-stone-900 font-medium truncate max-w-xs">
          {isAr ? product.title : product.titleFr}
        </span>
      </div>

      {/* Main Grid: Gallery Left + Purchase Module Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Media & Gallery (Columns 1-7) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Photos vs Video Tab Switcher */}
          {product.videoUrl && (
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setActiveMediaTab('photos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeMediaTab === 'photos'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {isAr ? 'صور المنتج' : 'Photos du produit'}
              </button>
              <button
                onClick={() => setActiveMediaTab('video')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeMediaTab === 'video'
                    ? 'bg-amber-600 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isAr ? 'فيديو توضيحي (Demo)' : 'Vidéo Démo'}</span>
              </button>
            </div>
          )}

          {/* Main Media Display */}
          <div className="relative aspect-4/3 sm:aspect-16/10 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shadow-xs">
            {activeMediaTab === 'photos' ? (
              <img
                src={
                  product.images[activeImageIndex] ||
                  '/src/assets/images/hero_qevorin_lifestyle_1793906502999.jpg'
                }
                alt={isAr ? product.title : product.titleFr}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-black flex items-center justify-center">
                <video
                  src={product.videoUrl}
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Thumbnails Gallery */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveImageIndex(idx);
                    setActiveMediaTab('photos');
                  }}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    activeImageIndex === idx && activeMediaTab === 'photos'
                      ? 'border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                      : 'border-stone-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Purchase Module (Columns 8-12) */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xs space-y-6">
          <div>
            {/* Category & Badge */}
            <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
              <span className="font-medium">{isAr ? product.categoryName : product.categoryNameFr}</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                {isAr ? 'متوفر للشحن الفوري بالمغرب' : 'Disponible pour livraison au Maroc'}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-stone-900 leading-snug mb-3">
              {isAr ? product.title : product.titleFr}
            </h1>

            {/* Rating & Moroccan Reviews */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                <span className="tabular-nums text-sm">{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-stone-300">|</span>
              <span className="text-stone-500">
                {product.reviewCount} {isAr ? 'تقييم زبناء موثق' : 'avis clients'}
              </span>
              <span className="text-stone-300">|</span>
              <span className="text-stone-400 font-mono text-[11px]">SKU: {selectedVariant?.sku || product.id}</span>
            </div>
          </div>

          {/* Pricing Box in MAD */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-stone-950 tabular-nums">
                {activePrice}{' '}
                <span className="text-base font-bold text-amber-600">{isAr ? 'درهم مغربي' : 'MAD'}</span>
              </span>
              {comparePrice && comparePrice > activePrice && (
                <span className="text-sm text-stone-400 line-through tabular-nums">
                  {comparePrice} {isAr ? 'د.م' : 'MAD'}
                </span>
              )}
            </div>

            {savings > 0 && (
              <div className="mt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 fill-emerald-600" />
                <span>
                  {isAr
                    ? `وفر الآن ${savings} درهم مغربي عند الطلب اليوم!`
                    : `Économisez ${savings} MAD sur cette commande !`}
                </span>
              </div>
            )}
          </div>

          {/* Variants Selector */}
          {product.variants.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                {isAr ? 'اختر النوع أو اللون:' : 'Sélectionnez une variante :'}
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const isChosen = selectedVariantId === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`py-2 px-3.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all ${
                        isChosen
                          ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {v.colorHex && (
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/40"
                          style={{ backgroundColor: v.colorHex }}
                        />
                      )}
                      <span>{isAr ? v.name : v.nameFr || v.name}</span>
                      {isChosen && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
              {isAr ? 'الكمية:' : 'Quantité :'}
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-stone-300 rounded-xl overflow-hidden bg-stone-50">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2.5 hover:bg-stone-200 text-stone-600 transition-colors"
                  aria-label="Decrease"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-12 text-center text-sm font-bold tabular-nums text-stone-900">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2.5 hover:bg-stone-200 text-stone-600 transition-colors"
                  aria-label="Increase"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs text-stone-500">
                {isAr
                  ? `الإجمالي: ${(activePrice * quantity)} درهم`
                  : `Total : ${(activePrice * quantity)} MAD`}
              </span>
            </div>
          </div>

          {/* Actions: Add to Cart & Buy Now COD */}
          <div className="space-y-3 pt-2">
            {/* Express Buy Now button (leads straight to COD Checkout) */}
            <button
              onClick={handleBuyNow}
              className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-sm sm:text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-5 h-5 fill-stone-950" />
              <span>{isAr ? 'اشتري الآن – الدفع عند الاستلام' : 'Acheter Maintenant (Paiement à la livraison)'}</span>
            </button>

            {/* Add to Cart button */}
            <button
              onClick={handleAddToCart}
              className="w-full py-3.5 px-6 rounded-2xl border-2 border-stone-900 bg-white hover:bg-stone-50 text-stone-900 font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-stone-800" />
              <span>{isAr ? 'إضافة إلى سلة المشتريات' : 'Ajouter au Panier'}</span>
            </button>
          </div>

          {/* COD Trust & Delivery Info */}
          <div className="pt-4 border-t border-stone-100 space-y-2.5 text-xs text-stone-600">
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {isAr
                  ? `شحن سريع بالمغرب خلال 24 إلى 48 ساعة (مجاني فوق ${storeSettings.freeShippingThreshold} درهم)`
                  : `Livraison express 24-48h (Gratuit dès ${storeSettings.freeShippingThreshold} MAD)`}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {isAr
                  ? 'الدفع نقداً بعد فحص محتوى الطلبية أمام الموزع'
                  : 'Paiement en espèces après ouverture et vérification du colis'}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {isAr ? 'إمكانية الاستبدال أو الإرجاع خلال 7 أيام' : 'Échange ou retour sous 7 jours sans conditions'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & Description Section */}
      <div className="mt-14 pt-10 border-t border-stone-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Description */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-lg font-bold font-serif text-stone-900">
              {isAr ? 'وصف المنتج وتفاصيل الاستخدام' : 'Description du Produit'}
            </h3>
            <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-line">
              {isAr ? product.description : product.descriptionFr}
            </p>
          </div>

          {/* Specifications Table */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-lg font-bold font-serif text-stone-900">
              {isAr ? 'المواصفات التقنية والضمان' : 'Caractéristiques Techniques'}
            </h3>
            <div className="rounded-2xl border border-stone-200 overflow-hidden divide-y divide-stone-100 text-xs">
              {product.specifications.map((spec, idx) => (
                <div key={idx} className="grid grid-cols-3 p-3 bg-white hover:bg-stone-50 transition-colors">
                  <span className="font-semibold text-stone-500">
                    {isAr ? spec.key : spec.keyFr || spec.key}
                  </span>
                  <span className="col-span-2 text-stone-900 font-medium">
                    {isAr ? spec.value : spec.valueFr || spec.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 pt-10 border-t border-stone-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold font-serif text-stone-900">
              {isAr ? 'منتجات ذات صلة قد تعجبك' : 'Produits Similaires'}
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
