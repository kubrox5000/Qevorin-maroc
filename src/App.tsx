/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { ToastContainer } from './components/common/Toast';
import { HeroBanner } from './components/home/HeroBanner';
import { CategorySlider } from './components/home/CategorySlider';
import { ProductGrid } from './components/home/ProductGrid';
import { PromoSection } from './components/home/PromoSection';
import { TestimonialsSection } from './components/home/TestimonialsSection';
import { ProductDetailView } from './components/product/ProductDetailView';
import { CategoryPageView } from './components/category/CategoryPageView';
import { CartDrawer } from './components/cart/CartDrawer';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { AdminLayout } from './components/admin/AdminLayout';

const MainContent: React.FC = () => {
  const { currentView, selectedProductId, selectedCategoryId } = useStore();

  if (currentView === 'admin') {
    return <AdminLayout />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 selection:bg-amber-500 selection:text-white">
      <Header />

      <main className="grow">
        {selectedProductId || currentView === 'product' ? (
          <ProductDetailView />
        ) : selectedCategoryId !== null || currentView === 'category' ? (
          <CategoryPageView />
        ) : (
          <>
            <HeroBanner />
            <CategorySlider />
            <ProductGrid />
            <PromoSection />
            <TestimonialsSection />
          </>
        )}
      </main>

      <Footer />

      {/* Persistent slide-out cart & checkout modals */}
      <CartDrawer />
      <CheckoutModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainContent />
    </StoreProvider>
  );
}
