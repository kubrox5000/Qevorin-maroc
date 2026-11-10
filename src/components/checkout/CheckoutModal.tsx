import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { MOROCCAN_CITIES } from '../../data/initialData';
import {
  X,
  ShieldCheck,
  Truck,
  CheckCircle2,
  MessageCircle,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    cartSubtotal,
    shippingFee,
    orderDiscountAmount,
    finalTotal,
    selectedCity,
    setSelectedCity,
    createOrder,
    lastConfirmedOrder,
    setLastConfirmedOrder,
    language,
    storeSettings,
  } = useStore();

  const isAr = language === 'ar';

  // Form inputs
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedOrder, setCopiedOrder] = useState(false);

  if (!isCheckoutOpen && !lastConfirmedOrder) return null;

  // Handle Moroccan checkout submit
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال اسمك الكامل' : 'Veuillez saisir votre nom complet');
      return;
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setErrorMsg(
        isAr
          ? 'يرجى إدخال رقم هاتف مغربي صحيح (مثال: 0612345678)'
          : 'Veuillez saisir un numéro de téléphone marocain valide'
      );
      return;
    }

    if (!address.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال عنوان التوصيل الكامل والحي' : 'Veuillez saisir votre adresse de livraison');
      return;
    }

    const cityObj = MOROCCAN_CITIES.find((c) => c.id === selectedCity);
    const cityName = isAr ? (cityObj?.nameAr || 'الدار البيضاء') : (cityObj?.nameFr || 'Casablanca');

    setIsSubmitting(true);
    try {
      await createOrder({
        fullName: fullName.trim(),
        phone: cleanPhone,
        city: cityName,
        address: address.trim(),
        notes: notes.trim(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل تسجيل الطلب، يرجى المحاولة ثانية';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setLastConfirmedOrder(null);
  };

  const handleCopyOrderNumber = (orderNum: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(orderNum);
      setCopiedOrder(true);
      setTimeout(() => setCopiedOrder(false), 2000);
    }
  };

  // Generate WhatsApp message for instant confirmation
  const getWhatsAppConfirmationUrl = (orderNum: string, name: string, city: string, total: number) => {
    const cleanWhatsApp = storeSettings.storeWhatsApp.replace(/[^0-9]/g, '');
    const textAr = encodeURIComponent(
      `السلام عليكم كيفورين، قمت بطلب أوردر جديد عبر الموقع:\nرقم الطلبية: ${orderNum}\nالاسم: ${name}\nالمدينة: ${city}\nالمبلغ الإجمالي: ${total} درهم\nأرجو تأكيد إرسال الطلبية وشكراً!`
    );
    return `https://wa.me/${cleanWhatsApp}?text=${textAr}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50/60">
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-serif text-stone-950">
              {lastConfirmedOrder
                ? isAr
                  ? 'تم تأكيد طلبيتك بنجاح!'
                  : 'Commande Confirmée avec Succès !'
                : isAr
                ? 'إتمام الطلب – الدفع عند الاستلام (COD)'
                : 'Finaliser la commande (Paiement à la livraison)'}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {lastConfirmedOrder
                ? isAr
                  ? 'شكراً لثقتكم في متجر كيفورين بالمغرب'
                  : 'Merci pour votre confiance sur Qevorin Maroc'
                : isAr
                ? 'املأ المعلومات التالية وسيتم شحن طلبيتك فوراً'
                : 'Remplissez le formulaire ci-dessous pour expédition immédiate'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ORDER CONFIRMATION VIEW */}
        {lastConfirmedOrder ? (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Success Hero */}
            <div className="text-center p-6 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-emerald-950">
                {isAr ? 'مبروك! تم تسجيل طلبيتك بنجاح' : 'Félicitations ! Commande Validée'}
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed max-w-md mx-auto">
                {isAr
                  ? `سيتصل بك موزع التوصيل في ${lastConfirmedOrder.customer.city} لتسليم الطلبية خلال 24-48 ساعة. يرجى إبقاء هاتفك مفتوحاً.`
                  : `Notre livreur à ${lastConfirmedOrder.customer.city} vous contactera sous 24-48h. Veuillez garder votre téléphone allumé.`}
              </p>

              {/* Order Reference Number */}
              <div className="pt-2 flex items-center justify-center gap-2">
                <div className="px-4 py-2 rounded-xl bg-white border border-emerald-300 font-mono text-sm font-bold text-stone-900 tracking-wider">
                  {lastConfirmedOrder.orderNumber}
                </div>
                <button
                  onClick={() => handleCopyOrderNumber(lastConfirmedOrder.orderNumber)}
                  className="p-2 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-800 transition-colors"
                  title={isAr ? 'نسخ رقم الطلب' : 'Copier'}
                >
                  {copiedOrder ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Invoice & Order Summary */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200 font-bold text-stone-800">
                <span>{isAr ? 'تفاصيل الطلبية' : 'Détails de la commande'}</span>
                <span>{lastConfirmedOrder.customer.fullName} ({lastConfirmedOrder.customer.phone})</span>
              </div>

              <div className="space-y-2">
                {lastConfirmedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-stone-700">
                    <span className="line-clamp-1">
                      {item.quantity}× {isAr ? item.productTitle : item.productTitleFr || item.productTitle}
                      {item.variantName ? ` (${item.variantName})` : ''}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {item.price * item.quantity} {isAr ? 'د.م' : 'MAD'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-stone-200 space-y-1">
                <div className="flex justify-between text-stone-600">
                  <span>{isAr ? 'المجموع الفرعي:' : 'Sous-total :'}</span>
                  <span className="tabular-nums">{lastConfirmedOrder.subtotal} {isAr ? 'د.م' : 'MAD'}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>{isAr ? 'رسوم الشحن والتوصيل:' : 'Frais de livraison :'}</span>
                  <span className="tabular-nums">
                    {lastConfirmedOrder.shippingFee === 0 ? (
                      <span className="text-emerald-700 font-bold">{isAr ? 'مجاني' : 'Gratuit'}</span>
                    ) : (
                      `${lastConfirmedOrder.shippingFee} ${isAr ? 'د.م' : 'MAD'}`
                    )}
                  </span>
                </div>
                {lastConfirmedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>{isAr ? 'الخصم المطبق:' : 'Remise déduite :'}</span>
                    <span className="tabular-nums">-{lastConfirmedOrder.discountAmount} {isAr ? 'د.م' : 'MAD'}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-extrabold text-stone-950">
                  <span>{isAr ? 'المبلغ المطلوب نقداً عند الاستلام:' : 'Total en espèces à la livraison :'}</span>
                  <span className="text-amber-800 tabular-nums">
                    {lastConfirmedOrder.total} {isAr ? 'درهم مغربي' : 'MAD'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action: Confirm via WhatsApp */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={getWhatsAppConfirmationUrl(
                  lastConfirmedOrder.orderNumber,
                  lastConfirmedOrder.customer.fullName,
                  lastConfirmedOrder.customer.city,
                  lastConfirmedOrder.total
                )}
                target="_blank"
                rel="noreferrer"
                className="grow py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>{isAr ? 'تأكيد فوري عبر واتساب للتعجيل بالشحن' : 'Confirmer via WhatsApp'}</span>
              </a>

              <button
                onClick={handleClose}
                className="py-3 px-6 rounded-2xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs sm:text-sm font-semibold transition-colors"
              >
                {isAr ? 'متابعة التسوق' : 'Continuer le shopping'}
              </button>
            </div>
          </div>
        ) : (
          /* MOROCCAN CHECKOUT FORM VIEW */
          <form onSubmit={handleSubmitOrder} className="p-6 sm:p-8 space-y-6">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Customer Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-stone-800">
                  {isAr ? 'الاسم الكامل *' : 'Nom & Prénom *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: يوسف الإدريسي' : 'Ex: Youssef El Idrissi'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-stone-300 bg-stone-50 py-2.5 px-3.5 text-stone-900 focus:bg-white focus:border-stone-900 focus:outline-none transition-colors"
                />
              </div>

              {/* Moroccan Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-800 flex items-center justify-between">
                  <span>{isAr ? 'رقم الهاتف المغربي *' : 'Téléphone Maroc *'}</span>
                  <span className="text-[11px] font-normal text-stone-400">
                    {isAr ? 'للتواصل قبل التوصيل' : 'Pour vous contacter'}
                  </span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder={isAr ? 'مثال: 06 12 34 56 78' : 'Ex: 06 12 34 56 78'}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-stone-300 bg-stone-50 py-2.5 px-3.5 text-stone-900 font-mono focus:bg-white focus:border-stone-900 focus:outline-none transition-colors"
                />
              </div>

              {/* Moroccan City Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-800">
                  {isAr ? 'المدينة *' : 'Ville de livraison *'}
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-stone-300 bg-stone-50 py-2.5 px-3.5 text-stone-900 focus:bg-white focus:border-stone-900 focus:outline-none cursor-pointer"
                >
                  {MOROCCAN_CITIES.map((city) => (
                    <option key={city.id} value={city.id}>
                      {isAr ? city.nameAr : city.nameFr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Delivery Address */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-stone-800">
                  {isAr ? 'عنوان التوصيل بالكامل والحي *' : 'Adresse complète & Quartier *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    isAr
                      ? 'مثال: حي المعاريف، زنقة الزرقطوني عمارة 14 الشقة 5'
                      : 'Ex: Maarif, Rue Zerktouni, Immeuble 14 Apt 5'
                  }
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-stone-300 bg-stone-50 py-2.5 px-3.5 text-stone-900 focus:bg-white focus:border-stone-900 focus:outline-none transition-colors"
                />
              </div>

              {/* Order Notes */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-stone-700">
                  {isAr ? 'ملاحظات إضافية (اختياري)' : 'Instructions de livraison (facultatif)'}
                </label>
                <input
                  type="text"
                  placeholder={
                    isAr
                      ? 'مثال: الاتصال قبل القدوم بساعة، أو التسليم في مقر العمل'
                      : 'Ex: Appeler avant le passage'
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs rounded-xl border border-stone-200 bg-stone-50 py-2 px-3 text-stone-800 focus:bg-white focus:border-stone-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Payment Method Notice (Cash on Delivery Only) */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-950 mb-0.5">
                  {isAr ? 'طريقة الدفع: الدفع نقداً عند الاستلام (Cash on Delivery)' : 'Paiement à la Livraison (COD)'}
                </h4>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  {isAr
                    ? 'لا تدفع أي مبلغ مسبقاً! ستدفع للموزع فقط عندما يصل طلبك إلى باب منزلك وتتأكد من جودة المنتجات.'
                    : 'Aucun paiement en ligne requis. Vous réglez directement le livreur en espèces à la réception de votre colis.'}
                </p>
              </div>
            </div>

            {/* Quick Order Totals Breakdown */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2">
              <div className="flex justify-between text-stone-600">
                <span>{isAr ? 'عدد المنتجات في السلة:' : 'Nombre d’articles :'}</span>
                <span className="font-semibold text-stone-900 tabular-nums">{cart.length}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>{isAr ? 'المجموع الجزئي:' : 'Sous-total :'}</span>
                <span className="font-semibold text-stone-900 tabular-nums">{cartSubtotal} {isAr ? 'درهم' : 'MAD'}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>{isAr ? 'رسوم التوصيل لـ ' + (isAr ? MOROCCAN_CITIES.find(c => c.id === selectedCity)?.nameAr : MOROCCAN_CITIES.find(c => c.id === selectedCity)?.nameFr) + ':' : 'Frais de livraison :'}</span>
                <span className="font-semibold text-stone-900 tabular-nums">
                  {shippingFee === 0 ? (
                    <span className="text-emerald-700 font-bold">{isAr ? 'توصيل مجاني' : 'Gratuit'}</span>
                  ) : (
                    `${shippingFee} ${isAr ? 'درهم' : 'MAD'}`
                  )}
                </span>
              </div>
              {orderDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>{isAr ? 'الخصم المطبق:' : 'Remise déduite :'}</span>
                  <span className="tabular-nums">-{orderDiscountAmount} {isAr ? 'درهم' : 'MAD'}</span>
                </div>
              )}
              <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-extrabold text-stone-950">
                <span>{isAr ? 'المجموع الكلي المطلوب:' : 'Montant Total à Payer :'}</span>
                <span className="text-base text-amber-800 tabular-nums">
                  {finalTotal} {isAr ? 'درهم مغربي' : 'MAD'}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-extrabold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Truck className="w-5 h-5" />
              <span>
                {isSubmitting
                  ? isAr
                    ? 'جاري تأكيد طلبيتك...'
                    : 'Confirmation en cours...'
                  : isAr
                  ? `تأكيد الطلب الآن – (${finalTotal} درهم عند الاستلام)`
                  : `Confirmer la Commande (${finalTotal} MAD)`}
              </span>
              {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
