import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Plus, X, Layers, Sparkles } from 'lucide-react';

export const AdminCategories: React.FC = () => {
  const { categories, addCategory, language } = useStore();
  const isAr = language === 'ar';

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [nameAr, setNameAr] = useState('');
  const [nameFr, setNameFr] = useState('');
  const [slug, setSlug] = useState('');
  const [descAr, setDescAr] = useState('');
  const [icon, setIcon] = useState('Sparkles');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) return;

    addCategory({
      name: nameAr.trim(),
      nameFr: nameFr.trim() || nameAr.trim(),
      slug: slug.trim() || nameAr.trim().toLowerCase().replace(/[\s\W-]+/g, '-'),
      icon,
      description: descAr.trim(),
      descriptionFr: descAr.trim(),
    });

    setNameAr('');
    setNameFr('');
    setSlug('');
    setDescAr('');
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl font-bold font-serif text-stone-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-600" />
            <span>{isAr ? 'إدارة أقسام المتجر (Categories)' : 'Gestion des Catégories'}</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {isAr ? 'الأقسام الثمانية المعتمدة لمتجر كيفورين بالمغرب' : 'Les 8 catégories de la boutique'}
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="self-start sm:self-auto py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>{isAr ? 'إضافة قسم جديد' : 'Nouvelle Catégorie'}</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-stone-400 font-mono">#{cat.slug}</span>
                <span className="px-2 py-0.5 bg-stone-100 rounded-md text-[11px] font-bold text-stone-800 tabular-nums">
                  {cat.productCount} {isAr ? 'منتج' : 'prod.'}
                </span>
              </div>
              <h3 className="font-bold text-stone-900 text-sm mb-1">{cat.name}</h3>
              <h4 className="text-xs font-medium text-stone-500 mb-2">{cat.nameFr}</h4>
              <p className="text-[11px] text-stone-600 leading-relaxed line-clamp-2">
                {isAr ? cat.description : cat.descriptionFr}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="text-sm font-bold text-stone-900">
                {isAr ? 'إضافة قسم جديد' : 'Nouvelle Catégorie'}
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'اسم القسم بالعربية *' : 'Nom en Arabe *'}
                </label>
                <input
                  type="text"
                  required
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: مستلزمات الرحلات"
                  className="w-full rounded-xl border border-stone-300 py-2 px-3 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'اسم القسم بالفرنسية' : 'Nom en Français'}
                </label>
                <input
                  type="text"
                  value={nameFr}
                  onChange={(e) => setNameFr(e.target.value)}
                  placeholder="Ex: Plein Air & Camping"
                  className="w-full rounded-xl border border-stone-300 py-2 px-3 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'المعرف الفريد (Slug)' : 'Slug URL'}
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="camping-outdoor"
                  className="w-full rounded-xl border border-stone-300 py-2 px-3 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'الوصف التوضيحي' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={descAr}
                  onChange={(e) => setDescAr(e.target.value)}
                  placeholder="مستلزمات التخييم ومعدات السفر..."
                  className="w-full rounded-xl border border-stone-300 py-2 px-3 focus:outline-none"
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
                  {isAr ? 'إضافة القسم' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
