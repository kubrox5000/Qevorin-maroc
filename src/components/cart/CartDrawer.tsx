import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Truck,
  Tag,
  Zap,
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    storeSettings,
    language,
    setIsCheckoutOpen,
    appliedDiscount,
    applyDiscountCode,
    removeDiscountCode,
    orderDiscountAmount,
    finalTotal,
    shippingFee,
  } = useStore();

  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; success: boolean } | null>(null);

  if (!isCartOpen) return null;

  const isAr = language === 'ar';
  const remainingForFreeShipping = Math.max(0, storeSettings.freeShippingThreshold - cartSubtotal);
  const freeShippingProgress = Math.min(
    100,
    Math.round((cartSubtotal / storeSettings.freeShippingThreshold) * 100)
  );

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const res = applyDiscountCode(promoInput);
    setPromoMessage({ text: res.message, success: res.success });
    if (res.success) {
      setPromoInput('');
    }
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 end-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-stone-900">
                {isAr ? 'سلة المشتريات' : 'Votre Panier'}
              </h2>
              <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-bold tabular-nums">
                {cart.length}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-amber-50/70 p-3.5 border-b border-amber-100/80">
            <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
              <span className="text-stone-700 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-600" />
                {remainingForFreeShipping > 0
                  ? isAr
                    ? `أضف ${remainingForFreeShipping} درهم للاستفادة من التوصيل المجاني!`
                    : `Ajoutez encore ${remainingForFreeShipping} MAD pour la livraison gratuite !`
                  : isAr
                  ? 'مبروك! لقد حصلت على توصيل مجاني لطلبيتك'
                  : 'Félicitations ! Livraison gratuite débloquée'}
              </span>
              <span className="font-bold text-amber-800 tabular-nums">{freeShippingProgress}%</span>
            </div>
            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="grow overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-800 mb-1">
                    {isAr ? 'سلة التسوق فارغة حالياً' : 'Votre panier est vide'}
                  </p>
                  <p className="text-xs text-stone-500">
                    {isAr ? 'استكشف تشكيلات كيفورين واختر ما يناسبك' : 'Découvrez nos nouveautés et commencez vos achats'}
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="py-2.5 px-6 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
                >
                  {isAr ? 'بدء التسوق الآن' : 'Faire du shopping'}
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3.5 p-3 rounded-2xl border border-stone-200/90 bg-stone-50/50"
                >
                  <img
                    src={item.image || '/src/assets/images/hero_qevorin_lifestyle_1793906502999.jpg'}
                    alt={item.productTitle}
                    referrerPolicy="no-referrer"
                    className="w-18 h-18 rounded-xl object-cover bg-white border border-stone-200 shrink-0"
                  />
                  <div className="flex flex-col justify-between grow">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-stone-900 line-clamp-1">
                          {isAr ? item.productTitle : item.productTitleFr || item.productTitle}
                        </h4>
                        {item.variantName && (
                          <span className="text-[11px] text-stone-500 block">
                            {item.variantName}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                        title={isAr ? 'حذف' : 'Supprimer'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden bg-white">
                        <button
                          onClick={() => updateCartQuantity(item.id, -1)}
                          className="px-2 py-1 text-stone-600 hover:bg-stone-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold tabular-nums text-stone-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.id, 1)}
                          className="px-2 py-1 text-stone-600 hover:bg-stone-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-stone-900 tabular-nums">
                        {item.price * item.quantity} {isAr ? 'د.م' : 'MAD'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary & Checkout Action */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-stone-200 bg-white space-y-4">
              {/* Promo Code Input */}
              <div>
                {appliedDiscount ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Tag className="w-3.5 h-3.5" />
                      <span>{appliedDiscount.code}</span>
                      <span className="text-[11px] font-normal text-emerald-600">
                        ({appliedDiscount.type === 'percentage' ? `-${appliedDiscount.value}%` : `-${appliedDiscount.value} د.م`})
                      </span>
                    </div>
                    <button
                      onClick={removeDiscountCode}
                      className="text-rose-600 hover:underline text-[11px] font-semibold"
                    >
                      {isAr ? 'إلغاء' : 'Retirer'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={isAr ? 'كود تخفيض (مثلاً: MAROC10)' : 'Code promo (ex: MAROC10)'}
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="grow text-xs rounded-xl border border-stone-300 px-3 py-2 uppercase placeholder:normal-case focus:border-stone-900 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="py-2 px-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shrink-0 transition-colors"
                    >
                      {isAr ? 'تطبيق' : 'Appliquer'}
                    </button>
                  </form>
                )}
                {promoMessage && (
                  <p
                    className={`text-[11px] mt-1.5 ${
                      promoMessage.success ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {promoMessage.text}
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex items-center justify-between">
                  <span>{isAr ? 'المجموع الجزئي' : 'Sous-total'}</span>
                  <span className="font-semibold text-stone-900 tabular-nums">
                    {cartSubtotal} {isAr ? 'درهم' : 'MAD'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>{isAr ? 'رسوم التوصيل' : 'Frais de livraison'}</span>
                  <span className="font-semibold text-stone-900 tabular-nums">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-700 font-bold">{isAr ? 'مجاني' : 'Gratuit'}</span>
                    ) : (
                      `${shippingFee} ${isAr ? 'درهم' : 'MAD'}`
                    )}
                  </span>
                </div>

                {orderDiscountAmount > 0 && (
                  <div className="flex items-center justify-between text-emerald-700 font-semibold">
                    <span>{isAr ? 'الخصم المطبق' : 'Réduction appliquée'}</span>
                    <span className="tabular-nums">-{orderDiscountAmount} {isAr ? 'درهم' : 'MAD'}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-sm font-extrabold text-stone-950">
                  <span>{isAr ? 'المجموع النهائي (الدفع عند الاستلام)' : 'Total à régler (Paiement à livraison)'}</span>
                  <span className="text-base text-amber-800 tabular-nums">
                    {finalTotal} {isAr ? 'درهم' : 'MAD'}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-stone-950" />
                <span>{isAr ? 'متابعة الطلب والدفع عند الاستلام' : 'Valider la commande (COD)'}</span>
                {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
