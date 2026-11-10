import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ShieldCheck, Lock, KeyRound, ArrowRight, ArrowLeft } from 'lucide-react';

export const AdminAuthModal: React.FC = () => {
  const { loginAdmin, setCurrentView, language } = useStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const isAr = language === 'ar';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = loginAdmin(password);
    if (!success) {
      setError(isAr ? 'كلمة المرور غير صحيحة. جرب: qevorin2026' : 'Mot de passe incorrect. Essayez : qevorin2026');
    }
  };

  const handleDemoAccess = () => {
    loginAdmin('qevorin2026');
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-stone-200 shadow-xl text-start">
      <div className="w-14 h-14 rounded-2xl bg-stone-900 text-amber-400 flex items-center justify-center mb-6 shadow-md">
        <ShieldCheck className="w-8 h-8" />
      </div>

      <h2 className="text-2xl font-bold font-serif text-stone-900 mb-2">
        {isAr ? 'لوحة إدارة متجر كيفورين' : 'Administration Qevorin'}
      </h2>
      <p className="text-xs text-stone-500 mb-6 leading-relaxed">
        {isAr
          ? 'منطقة محمية لإدارة المنتجات، طلبيات الدفع عند الاستلام بالمغرب، المخزون، واستيراد AliExpress.'
          : 'Espace sécurisé réservé aux gérants de la boutique Qevorin Maroc.'}
      </p>

      {error && (
        <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-stone-700 block mb-1.5">
            {isAr ? 'كلمة مرور المشرف' : 'Mot de passe administrateur'}
          </label>
          <div className="relative">
            <input
              type="password"
              placeholder={isAr ? 'أدخل كلمة المرور (qevorin2026)' : 'Mot de passe'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-xl border border-stone-300 py-2.5 ps-10 pe-3 text-stone-900 focus:outline-none focus:border-stone-900"
            />
            <Lock className="w-4 h-4 text-stone-400 absolute top-3 start-3" />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 px-4 rounded-xl bg-stone-950 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <KeyRound className="w-4 h-4 text-amber-400" />
          <span>{isAr ? 'تسجيل الدخول للإدارة' : 'Se connecter'}</span>
        </button>
      </form>

      {/* Demo Quick Access Helper */}
      <div className="mt-6 pt-5 border-t border-stone-200 text-center space-y-3">
        <p className="text-xs text-stone-500">
          {isAr ? 'كلمة المرور الافتراضية للتجربة: ' : 'Mot de passe par défaut pour le test : '}
          <code className="px-2 py-0.5 bg-stone-100 rounded text-stone-900 font-mono font-bold">
            qevorin2026
          </code>
        </p>

        <button
          onClick={handleDemoAccess}
          className="w-full py-2.5 px-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 hover:bg-amber-500/25 font-bold text-xs transition-colors"
        >
          {isAr ? 'دخول تجريبي فوري بنقرة واحدة (Demo Access)' : 'Accès démo immédiat'}
        </button>

        <button
          onClick={() => setCurrentView('home')}
          className="text-xs text-stone-400 hover:text-stone-700 transition-colors pt-2 block mx-auto"
        >
          {isAr ? '← العودة للمتجر' : '← Retour à la boutique'}
        </button>
      </div>
    </div>
  );
};
