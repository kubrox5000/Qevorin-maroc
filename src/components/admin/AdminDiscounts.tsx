import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Tag, Plus, Trash2, Check, X } from 'lucide-react';

export const AdminDiscounts: React.FC = () => {
  const { discounts, addDiscount, toggleDiscount, deleteDiscount, language } = useStore();
  const isAr = language === 'ar';

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState<number>(10);
  const [minSpend, setMinSpend] = useState<number>(200);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    addDiscount({
      code: code.trim().toUpperCase(),
      type,
      value,
      minSpend,
      expiresAt: '2026-12-31',
      isActive: true,
    });

    setCode('');
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl font-bold font-serif text-stone-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-600" />
            <span>{isAr ? 'رموز التخفيض والعروض الترويجية' : 'Codes Promo & Réductions'}</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {isAr ? 'إنشاء وإدارة كوبونات الخصم بالدرهم أو النسبة المئوية.' : 'Gestion des codes promotionnels.'}
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="self-start sm:self-auto py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>{isAr ? 'إنشاء كود تخفيض' : 'Nouveau Code'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {discounts.map((disc) => (
          <div
            key={disc.id}
            className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-base font-black text-amber-900 tracking-wider">
                  {disc.code}
                </span>
                <button
                  onClick={() => toggleDiscount(disc.id)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                    disc.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {disc.isActive ? (isAr ? 'مفعّل' : 'Actif') : isAr ? 'معطل' : 'Inactif'}
                </button>
              </div>

              <div className="text-lg font-bold text-stone-900 mb-2 tabular-nums">
                {disc.type === 'percentage' ? `خصم ${disc.value}%` : `خصم ${disc.value} درهم`}
              </div>

              <p className="text-xs text-stone-500 mb-3">
                {disc.minSpend
                  ? isAr
                    ? `الحد الأدنى للطلب: ${disc.minSpend} درهم`
                    : `Min. d’achat : ${disc.minSpend} MAD`
                  : isAr
                  ? 'بدون حد أدنى للطلب'
                  : 'Sans minimum'}
              </p>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
              <span>{isAr ? `استخدم ${disc.usageCount} مرة` : `${disc.usageCount} utilisations`}</span>
              <button
                onClick={() => deleteDiscount(disc.id)}
                className="text-stone-400 hover:text-rose-600 p-1 transition-colors"
                title={isAr ? 'حذف' : 'Supprimer'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="text-sm font-bold text-stone-900">
                {isAr ? 'إنشاء كود تخفيض جديد' : 'Nouveau Code Promo'}
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'رمز الكود (بالأحرف الكبيرة) *' : 'Code promo *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="MAROC15"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-stone-300 py-2 px-3 font-mono uppercase focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    {isAr ? 'نوع الخصم' : 'Type de remise'}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full rounded-xl border border-stone-300 py-2 px-3 focus:outline-none"
                  >
                    <option value="percentage">{isAr ? 'نسبة مئوية (%)' : 'Pourcentage (%)'}</option>
                    <option value="fixed">{isAr ? 'مبلغ ثابت (درهم)' : 'Fixe (MAD)'}</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    {isAr ? 'قيمة الخصم' : 'Valeur'}
                  </label>
                  <input
                    type="number"
                    required
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full rounded-xl border border-stone-300 py-2 px-3 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'الحد الأدنى لقيمة الطلب (MAD)' : 'Montant minimum d’achat (MAD)'}
                </label>
                <input
                  type="number"
                  value={minSpend}
                  onChange={(e) => setMinSpend(Number(e.target.value))}
                  className="w-full rounded-xl border border-stone-300 py-2 px-3 font-mono focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="py-2 px-4 rounded-xl border border-stone-300 text-stone-700 font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-stone-900 text-white font-bold"
                >
                  {isAr ? 'حفظ الكود' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
