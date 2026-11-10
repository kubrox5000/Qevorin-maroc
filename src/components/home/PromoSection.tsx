import React from 'react';
import { useStore } from '../../context/StoreContext';
import { ArrowLeft, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export const PromoSection: React.FC = () => {
  const { language, quickBuy, products, setSelectedProductId, setCurrentView } = useStore();
  const isAr = language === 'ar';

  const arganProduct = products.find((p) => p.id === 'prod-argan-elixir-bio') || products[0];

  const handleBuyNow = () => {
    if (arganProduct) {
      quickBuy(arganProduct);
    }
  };

  const handleLearnMore = () => {
    if (arganProduct) {
      setSelectedProductId(arganProduct.id);
      setCurrentView('product');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="relative overflow-hidden rounded-3xl bg-amber-950/15 border border-amber-900/10 p-6 sm:p-10 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text and Offer Details */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-600/10 text-amber-800 text-xs font-bold">
              <span>{isAr ? 'عرض حصري مغربي' : 'Édition Exclusive Maroc'}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-900 leading-tight">
              {isAr
                ? 'إكسير الأركان المغربي الأصيل – عناية ملكية للبشرة والشعر'
                : 'Élixir Pur d’Argan Bio du Maroc – Soin d’Exception'}
            </h3>

            <p className="text-stone-600 text-sm leading-relaxed">
              {isAr
                ? 'مستخلص نقي معصور على البارد من أشجار أركان منطقة سوس. يمنح بشرتك نضارة فورية وتغذية عميقة لمكافحة التجاعيد وجفاف البشرة. حاصل على شهادة الجودة العضوية مع ضمان استرجاع حقيقي.'
                : 'Pressé à froid dans la tradition berbère du Souss. Régénère en profondeur, nourrit et illumine le teint naturellement.'}
            </p>

            {/* Pricing Comparison */}
            <div className="flex items-center gap-4 py-2 border-y border-amber-900/10">
              <div>
                <span className="text-xs text-stone-500 block">{isAr ? 'السعر الترويجي' : 'Prix Spécial'}</span>
                <span className="text-2xl font-black text-amber-900 tabular-nums">
                  249 <span className="text-sm font-bold">{isAr ? 'درهم فقط' : 'MAD'}</span>
                </span>
              </div>
              <div className="border-s border-stone-300 ps-4">
                <span className="text-xs text-stone-400 line-through tabular-nums block">380 MAD</span>
                <span className="text-xs font-bold text-emerald-700">
                  {isAr ? 'وفرت 131 درهم (34%-)' : 'Économisez 131 MAD'}
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleBuyNow}
                className="py-3 px-6 rounded-xl bg-stone-950 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-sm"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'طلب فوري (الدفع عند الاستلام)' : 'Commander en Espèces'}</span>
              </button>

              <button
                onClick={handleLearnMore}
                className="py-3 px-5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-1.5"
              >
                <span>{isAr ? 'معرفة المزيد' : 'En savoir plus'}</span>
                {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-stone-600">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>{isAr ? 'توصيل مجاني خلال 24 ساعة للدار البيضاء والرباط ومراكش' : 'Livraison sous 24h à Casablanca, Rabat et Marrakech'}</span>
            </div>
          </div>

          {/* Product Image */}
          <div className="relative rounded-2xl overflow-hidden aspect-4/3 bg-white shadow-sm border border-stone-200/80">
            <img
              src="/src/assets/images/product_argan_beauty_1793906503560.jpg"
              alt="Moroccan Argan Elixir"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover hover:scale-102 transition-transform duration-500"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
