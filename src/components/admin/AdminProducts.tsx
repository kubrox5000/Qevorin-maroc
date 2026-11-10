import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductVariant } from '../../types';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Eye,
  Check,
  X,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';

export const AdminProducts: React.FC = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct, language } = useStore();
  const isAr = language === 'ar';

  const [search, setSearch] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states for Add / Edit
  const [titleAr, setTitleAr] = useState('');
  const [titleFr, setTitleFr] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'electronics');
  const [priceMAD, setPriceMAD] = useState<number>(299);
  const [comparePriceMAD, setComparePriceMAD] = useState<number>(450);
  const [imageUrl, setImageUrl] = useState('');
  const [descAr, setDescAr] = useState('');
  const [descFr, setDescFr] = useState('');
  const [badge, setBadge] = useState<'featured' | 'bestseller' | 'new' | 'sale' | ''>('featured');

  // Open modal in Add mode
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setTitleAr('');
    setTitleFr('');
    setCategoryId(categories[0]?.id || 'electronics');
    setPriceMAD(299);
    setComparePriceMAD(450);
    setImageUrl('/src/assets/images/hero_qevorin_lifestyle_1793906502999.jpg');
    setDescAr('');
    setDescFr('');
    setBadge('featured');
    setIsAddModalOpen(true);
  };

  // Open modal in Edit mode
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setTitleAr(p.title);
    setTitleFr(p.titleFr);
    setCategoryId(p.categoryId);
    setPriceMAD(p.price);
    setComparePriceMAD(p.compareAtPrice || 0);
    setImageUrl(p.images[0] || '');
    setDescAr(p.description);
    setDescFr(p.descriptionFr);
    setBadge(p.badge || '');
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleAr.trim()) return;

    const chosenCat = categories.find((c) => c.id === categoryId);
    const catName = chosenCat ? chosenCat.name : 'عام';
    const catNameFr = chosenCat ? chosenCat.nameFr : 'Général';

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        title: titleAr.trim(),
        titleFr: titleFr.trim() || titleAr.trim(),
        categoryId,
        categoryName: catName,
        categoryNameFr: catNameFr,
        price: priceMAD,
        compareAtPrice: comparePriceMAD > priceMAD ? comparePriceMAD : undefined,
        images: imageUrl ? [imageUrl] : editingProduct.images,
        description: descAr.trim(),
        descriptionFr: descFr.trim() || descAr.trim(),
        badge: badge ? badge : undefined,
      });
    } else {
      const defaultVariant: ProductVariant = {
        id: `var-${Date.now()}`,
        name: isAr ? 'الافتراضي' : 'Défaut',
        sku: `QEV-${Math.floor(1000 + Math.random() * 9000)}`,
        price: priceMAD,
        compareAtPrice: comparePriceMAD,
      };

      addProduct({
        title: titleAr.trim(),
        titleFr: titleFr.trim() || titleAr.trim(),
        slug: titleAr.trim().toLowerCase().replace(/[\s\W-]+/g, '-'),
        description: descAr.trim() || titleAr.trim(),
        descriptionFr: descFr.trim() || titleAr.trim(),
        categoryId,
        categoryName: catName,
        categoryNameFr: catNameFr,
        price: priceMAD,
        compareAtPrice: comparePriceMAD > priceMAD ? comparePriceMAD : undefined,
        images: [imageUrl || '/src/assets/images/hero_qevorin_lifestyle_1793906502999.jpg'],
        badge: badge ? badge : undefined,
        variants: [defaultVariant],
        specifications: [
          { key: 'الضمان', value: 'ضمان استبدال حقيقي بالمغرب', keyFr: 'Garantie', valueFr: 'Garantie échange au Maroc' },
          { key: 'التوصيل', value: 'الدفع نقداً عند الاستلام', keyFr: 'Paiement', valueFr: 'Paiement à la livraison' },
        ],
        rating: 5.0,
        reviewCount: 1,
        isPublished: true,
      });
    }

    setIsAddModalOpen(false);
  };

  // Filter list
  const filtered = products.filter((p) => {
    if (selectedCatFilter && p.categoryId !== selectedCatFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.titleFr.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl font-bold font-serif text-stone-900">
            {isAr ? 'إدارة كتالوج المنتجات' : 'Catalogue Produits'}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {isAr
              ? `إجمالي ${products.length} منتج مسجل بالمتجر مع الأسعار بالدرهم المغربي (MAD)`
              : `${products.length} références disponibles`}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="self-start sm:self-auto py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>{isAr ? 'إضافة منتج جديد' : 'Nouveau Produit'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative grow">
          <input
            type="text"
            placeholder={isAr ? 'البحث عن منتج بالاسم...' : 'Rechercher un produit...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs rounded-xl border border-stone-200 bg-white py-2 ps-9 pe-3 text-stone-900 focus:outline-none focus:border-stone-900"
          />
          <Search className="w-4 h-4 text-stone-400 absolute top-2.5 start-3" />
        </div>

        <select
          value={selectedCatFilter}
          onChange={(e) => setSelectedCatFilter(e.target.value)}
          className="text-xs bg-white border border-stone-200 rounded-xl py-2 px-3 text-stone-800 focus:outline-none cursor-pointer"
        >
          <option value="">{isAr ? 'جميع الأقسام' : 'Toutes les catégories'}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {isAr ? c.name : c.nameFr}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-medium">
              <tr>
                <th className="py-3 px-4 text-start">{isAr ? 'المنتج' : 'Produit'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'القسم' : 'Catégorie'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'السعر (MAD)' : 'Prix (MAD)'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'الخيارات والأنواع' : 'Options & Variantes'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'الحالة' : 'Statut'}</th>
                <th className="py-3 px-4 text-end">{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((prod) => (
                <tr key={prod.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={prod.images[0] || '/src/assets/images/hero_qevorin_lifestyle_1793906502999.jpg'}
                        alt={prod.title}
                        className="w-10 h-10 rounded-lg object-cover bg-stone-100 border border-stone-200 shrink-0"
                      />
                      <div>
                        <span className="font-bold text-stone-900 line-clamp-1 block">
                          {isAr ? prod.title : prod.titleFr}
                        </span>
                        {prod.isAliExpressImport && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm">
                            AliExpress Import
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-stone-600 font-medium">
                    {isAr ? prod.categoryName : prod.categoryNameFr}
                  </td>
                  <td className="py-3 px-4 font-bold text-stone-950 tabular-nums">
                    {prod.price} {isAr ? 'د.م' : 'MAD'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="tabular-nums font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md text-[11px]">
                      {prod.variants.length} {isAr ? 'أنواع/خيارات' : 'variantes'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => updateProduct(prod.id, { isPublished: !prod.isPublished })}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                        prod.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {prod.isPublished ? (isAr ? 'منشور' : 'Actif') : isAr ? 'مسودة' : 'Brouillon'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-end">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(prod)}
                        className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                        title={isAr ? 'تعديل' : 'Modifier'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(isAr ? 'هل أنت متأكد من حذف هذا المنتج؟' : 'Supprimer ce produit ?')) {
                            deleteProduct(prod.id);
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title={isAr ? 'حذف' : 'Supprimer'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="text-base font-bold text-stone-900">
                {editingProduct
                  ? isAr
                    ? 'تعديل بيانات المنتج'
                    : 'Modifier le produit'
                  : isAr
                  ? 'إضافة منتج جديد لكتالوج كيفورين'
                  : 'Nouveau Produit'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 text-xs">
              {/* Titles */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'اسم المنتج بالعربية *' : 'Titre en Arabe *'}
                </label>
                <input
                  type="text"
                  required
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  placeholder="مثال: سماعات لاسلكية برو"
                  className="w-full text-xs rounded-xl border border-stone-300 py-2 px-3 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'اسم المنتج بالفرنسية' : 'Titre en Français'}
                </label>
                <input
                  type="text"
                  value={titleFr}
                  onChange={(e) => setTitleFr(e.target.value)}
                  placeholder="Ex: Écouteurs Sans Fil Pro"
                  className="w-full text-xs rounded-xl border border-stone-300 py-2 px-3 focus:outline-none focus:border-stone-900"
                />
              </div>

              {/* Category & Badge */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    {isAr ? 'القسم *' : 'Catégorie *'}
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full text-xs rounded-xl border border-stone-300 py-2 px-3 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {isAr ? c.name : c.nameFr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    {isAr ? 'الشارة الترويجية' : 'Badge'}
                  </label>
                  <select
                    value={badge}
                    onChange={(e) => setBadge(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-stone-300 py-2 px-3 focus:outline-none"
                  >
                    <option value="">{isAr ? 'بدون شارة' : 'Aucun'}</option>
                    <option value="featured">{isAr ? 'عروض مميزة' : 'En Vedette'}</option>
                    <option value="bestseller">{isAr ? 'الأكثر طلباً' : 'Best-Seller'}</option>
                    <option value="new">{isAr ? 'وصل حديثاً' : 'Nouveau'}</option>
                    <option value="sale">{isAr ? 'تخفيض خاص' : 'Solde'}</option>
                  </select>
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    {isAr ? 'السعر (MAD) *' : 'Prix (MAD) *'}
                  </label>
                  <input
                    type="number"
                    required
                    value={priceMAD}
                    onChange={(e) => setPriceMAD(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-stone-300 py-2 px-3 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    {isAr ? 'السعر قبل الخصم' : 'Prix Barré'}
                  </label>
                  <input
                    type="number"
                    value={comparePriceMAD}
                    onChange={(e) => setComparePriceMAD(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-stone-300 py-2 px-3 font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'رابط الصورة الأساسية' : 'URL de l’image'}
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="/src/assets/images/... أو رابط مباشر"
                  className="w-full text-xs rounded-xl border border-stone-300 py-2 px-3 focus:outline-none"
                />
              </div>

              {/* Descriptions */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'وصف المنتج بالعربية' : 'Description en Arabe'}
                </label>
                <textarea
                  rows={3}
                  value={descAr}
                  onChange={(e) => setDescAr(e.target.value)}
                  placeholder="مواصفات واستخدامات المنتج..."
                  className="w-full text-xs rounded-xl border border-stone-300 py-2 px-3 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2 px-4 rounded-xl border border-stone-300 text-stone-700 font-semibold hover:bg-stone-50"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-stone-900 text-white font-bold hover:bg-stone-800"
                >
                  {isAr ? 'حفظ المنتج' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
