import React from 'react';
import { useStore } from '../../context/StoreContext';
import { ShieldCheck, Truck, RotateCcw, PhoneCall, Heart, MapPin, MessageCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  const { language, storeSettings, setSelectedCategoryId, setCurrentView } = useStore();
  const isAr = language === 'ar';

  const handleCategoryClick = (catId: string) => {
    setSelectedCategoryId(catId);
    setCurrentView('category');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800">
      {/* 4 Trust Pillars */}
      <div className="border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-stone-800 text-amber-400 shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-0.5">
                  {isAr ? 'توصيل سريع بالمغرب' : 'Livraison Rapide Maroc'}
                </h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  {isAr ? 'من 24 إلى 48 ساعة لجميع مدن وقرى المملكة' : '24h à 48h dans toutes les villes du Royaume'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-stone-800 text-amber-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-0.5">
                  {isAr ? 'الدفع عند الاستلام' : 'Paiement à la Livraison'}
                </h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  {isAr ? 'لا تدفع درهماً حتى تستلم وتفحص طلبيتك' : 'Payez en espèces après vérification du colis'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-stone-800 text-amber-400 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-0.5">
                  {isAr ? 'ضمان الاستبدال 7 أيام' : 'Garantie Retour 7 Jours'}
                </h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  {isAr ? 'حق الاستبدال أو استرجاع أموالك بكل سهولة' : 'Échange ou remboursement sans tracas'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-stone-800 text-amber-400 shrink-0">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-0.5">
                  {isAr ? 'خدمة عملاء مغربية' : 'Service Client 7j/7'}
                </h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  {isAr ? 'فريق مغربي متاح للرد على استفساراتكم' : 'Support dédié par téléphone & WhatsApp'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-stone-950 font-bold text-base">
                Q
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-serif">
                QEVORIN
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              {isAr
                ? 'منصة التجارة الإلكترونية المغربية المستقلة. نختار لكم أفضل المنتجات العالمية والمحلية بأفضل الأسعار مع التوصيل السريع والدفع نقداً عند الاستلام.'
                : 'Plateforme marocaine indépendante de commerce électronique. Produits de qualité, expédition express et paiement sécurisé à la livraison.'}
            </p>
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{isAr ? 'المغرب – الدار البيضاء، مراكش، الرباط، طنجة' : 'Maroc – Casablanca, Rabat, Marrakech, Tanger'}</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-100 mb-4">
              {isAr ? 'أشهر الأقسام' : 'Rayons Populaires'}
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <button
                  onClick={() => handleCategoryClick('electronics')}
                  className="hover:text-amber-400 transition-colors"
                >
                  {isAr ? 'الإلكترونيات والساعات الذكية' : 'Électronique & Montres'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('home-kitchen')}
                  className="hover:text-amber-400 transition-colors"
                >
                  {isAr ? 'المنزل ومكائن القهوة' : 'Maison & Machines à Café'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('beauty')}
                  className="hover:text-amber-400 transition-colors"
                >
                  {isAr ? 'العناية وزيت الأركان النقي' : 'Beauté & Huile d’Argan'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('fashion')}
                  className="hover:text-amber-400 transition-colors"
                >
                  {isAr ? 'الموضة والأزياء الرجالية والنسائية' : 'Mode & Vêtements'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('automotive')}
                  className="hover:text-amber-400 transition-colors"
                >
                  {isAr ? 'مستلزمات وإكسسوارات السيارات' : 'Accessoires Automobile'}
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-100 mb-4">
              {isAr ? 'خدمة الزبناء بالمغرب' : 'Service Client'}
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>{isAr ? 'أوقات العمل: من الإثنين إلى السبت (9:00 - 20:00)' : 'Du Lundi au Samedi (9h - 20h)'}</li>
              <li className="pt-1">
                <a
                  href={`https://wa.me/${storeSettings.storeWhatsApp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تواصل عبر واتساب' : 'Assistance WhatsApp'}</span>
                </a>
              </li>
              <li className="pt-1 text-[11px] text-stone-500">
                {isAr ? `الهاتف: ${storeSettings.storePhone}` : `Tél : ${storeSettings.storePhone}`}
              </li>
              <li className="text-[11px] text-stone-500">
                {isAr ? `البريد: ${storeSettings.storeEmail}` : `Email : ${storeSettings.storeEmail}`}
              </li>
            </ul>
          </div>

          {/* Morocco Delivery Cities Coverage */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-100 mb-4">
              {isAr ? 'تغطية التوصيل بالمغرب' : 'Livraison Nationale'}
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed mb-3">
              {isAr
                ? 'نوصل طلبياتكم عبر موزعين معتمدين إلى الدار البيضاء، الرباط، مراكش، طنجة، فاس، أكادير، وجدة، مكناس، تطوان، القنيطرة وجميع المدن المغربية.'
                : 'Expédition directe à Casablanca, Rabat, Marrakech, Tanger, Fès, Agadir, Oujda, Meknès et dans tout le Maroc.'}
            </p>
            <div className="p-3 rounded-xl bg-stone-800/80 border border-stone-700/60 text-[11px] text-amber-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{isAr ? 'دفع نقدي آمن عند الاستلام (COD)' : 'Paiement à la livraison 100% sécurisé'}</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <span>© {new Date().getFullYear()} QEVORIN SARL.</span>
            <span>{isAr ? 'جميع الحقوق محفوظة بالمملكة المغربية.' : 'Tous droits réservés au Maroc.'}</span>
          </div>

          <div className="flex items-center gap-4 text-stone-400 text-xs">
            <span>{isAr ? 'صنع بعناية للتجارة المغربية' : 'Conçu pour le e-commerce marocain'}</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </div>
        </div>
      </div>
    </footer>
  );
};
