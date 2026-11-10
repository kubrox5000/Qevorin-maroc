import React from 'react';
import { useStore } from '../../context/StoreContext';
import { INITIAL_TESTIMONIALS } from '../../data/initialData';
import { Star, CheckCircle, Quote } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  const { language } = useStore();
  const isAr = language === 'ar';

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              {isAr ? 'آراء زبنائنا بالمغرب' : 'Avis Clients Vérifiés'}
            </span>
            <span className="text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded-sm">
              {isAr ? 'محتوى توضيحي تجريبي' : 'Démo'}
            </span>
          </div>
          <h2 className="text-2xl font-bold font-serif text-stone-900">
            {isAr ? 'ثقة زبنائنا في جودة الخدمة والتوصيل' : 'Ils font confiance à Qevorin'}
          </h2>
        </div>
        <p className="text-xs text-stone-500 max-w-sm mt-2 sm:mt-0">
          {isAr
            ? 'أكثر من 1,500 زبون راضٍ في مختلف المدن المغربية مع خدمة الدفع عند الاستلام'
            : 'Plus de 1 500 clients satisfaits à travers le Royaume avec le paiement à la livraison.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {INITIAL_TESTIMONIALS.map((test) => (
          <div
            key={test.id}
            className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs flex flex-col justify-between"
          >
            <div>
              {/* Star Rating & Quote Mark */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-0.5 text-amber-400">
                  {Array.from({ length: test.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                  ))}
                </div>
                <Quote className="w-5 h-5 text-stone-200" />
              </div>

              {/* Review Text */}
              <p className="text-xs text-stone-700 leading-relaxed mb-4">
                "{isAr ? test.comment : test.commentFr}"
              </p>
            </div>

            {/* Author info with unboxed metadata */}
            <div className="pt-3 border-t border-stone-100 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900">{test.customerName}</span>
                {test.verifiedBuyer && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                    <CheckCircle className="w-3 h-3" />
                    <span>{isAr ? 'مشترٍ موثق' : 'Achat vérifié'}</span>
                  </span>
                )}
              </div>
              <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
                <span>{test.city}</span>
                <span aria-hidden="true">·</span>
                <span>{test.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
