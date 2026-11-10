import React from 'react';
import { useStore } from '../../context/StoreContext';
import { ArrowLeft, ArrowRight, ShieldCheck, Truck, Sparkles, CheckCircle2 } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  const { language, setCurrentView, setSelectedCategoryId } = useStore();
  const isAr = language === 'ar';

  const handleShopNow = () => {
    setSelectedCategoryId(null);
    setCurrentView('category');
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleDeals = () => {
    setSelectedCategoryId('electronics');
    setCurrentView('category');
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden bg-stone-900 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 my-6 shadow-xl">
      {/* Background Hero Photography */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/hero_qevorin_lifestyle_1793906502999.jpg"
          alt="Qevorin Premium Lifestyle"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-40 mix-blend-luminosity scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-900/90 to-stone-900/60" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-16 sm:py-24 lg:py-28">
        <div className="max-w-2xl">
          {/* Subtle Lead In */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {isAr
                ? 'المنصة المغربية الرائدة للتسوق الإلكتروني المستقل'
                : 'La plateforme marocaine d’e-commerce d’exception'}
            </span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-serif text-white mb-6 leading-[1.2] text-balance">
            {isAr
              ? 'تسوق أرقى المنتجات العالمية بأفضل الأسعار مع الدفع عند الاستلام'
              : 'L’Excellence du Shopping au Maroc avec Paiement à la Livraison'}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-stone-300 mb-8 leading-relaxed font-normal">
            {isAr
              ? 'اكتشف أحدث الإلكترونيات الذكية، مستلزمات المنزل، العناية المغربية الأصلية بالأركان، والأزياء العصرية مع توصيل سريع وموثوق إلى باب منزلك في 24-48 ساعة.'
              : 'Découvrez notre sélection exclusive d’électronique, art de la table, soins naturels à l’argan et mode avec expédition express partout au Maroc.'}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={handleShopNow}
              className="py-3.5 px-7 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-amber-500/20"
            >
              <span>{isAr ? 'تسوق المنتجات الآن' : 'Explorer la boutique'}</span>
              {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>

            <button
              onClick={handleDeals}
              className="py-3.5 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm backdrop-blur-xs border border-white/20 transition-colors"
            >
              {isAr ? 'تصفح عروض الإلكترونيات' : 'Offres Électronique'}
            </button>
          </div>

          {/* Trust strip below hero */}
          <div className="mt-12 pt-8 border-t border-stone-800/80 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-stone-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{isAr ? 'الدفع نقداً بعد المعاينة' : 'Paiement après vérification'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{isAr ? 'توصيل مجاني فوق 300 د.م' : 'Gratuit dès 300 MAD'}</span>
            </div>
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{isAr ? 'ضمان أصلي 100%' : 'Qualité 100% certifiée'}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
