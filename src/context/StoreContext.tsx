import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Category,
  CartItem,
  Order,
  DiscountCode,
  StoreSettings,
  Language,
  OrderStatus,
  MoroccanCustomer,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_DISCOUNTS,
  INITIAL_STORE_SETTINGS,
  MOROCCAN_CITIES,
} from '../data/initialData';
import {
  apiGetProducts,
  apiCreateProduct,
  apiUpdateProduct,
  apiDeleteProduct,
  apiGetCategories,
  apiCreateCategory,
  apiGetOrders,
  apiCreateOrder,
  apiUpdateOrderStatus,
  apiGetDiscounts,
  apiCreateDiscount,
  apiDeleteDiscount,
  apiGetSettings,
  apiUpdateSettings,
  apiAdminLogin,
  apiVerifyAdminSession,
  apiCheckNeonStatus,
  apiRunNeonMigration,
  NeonStatusData,
  setAdminToken,
  getAdminToken,
} from '../lib/api';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
}

interface StoreContextType {
  // Navigation & View
  currentView: 'home' | 'category' | 'product' | 'cart' | 'checkout' | 'admin';
  setCurrentView: (view: 'home' | 'category' | 'product' | 'cart' | 'checkout' | 'admin') => void;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (catId: string | null) => void;
  selectedProductId: string | null;
  setSelectedProductId: (prodId: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Language & Localization
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isRtl: boolean;

  // Catalog
  products: Product[];
  categories: Category[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'productCount'>) => Promise<void>;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, variantId?: string, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  cartSubtotal: number;
  cartTotalQuantity: number;

  // Checkout & Pricing
  selectedCity: string;
  setSelectedCity: (cityId: string) => void;
  appliedDiscount: DiscountCode | null;
  applyDiscountCode: (code: string) => { success: boolean; message: string };
  removeDiscountCode: () => void;
  shippingFee: number;
  orderDiscountAmount: number;
  finalTotal: number;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  lastConfirmedOrder: Order | null;
  setLastConfirmedOrder: (order: Order | null) => void;
  createOrder: (customer: MoroccanCustomer) => Promise<Order>;

  // Orders
  orders: Order[];
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;

  // Discounts & Settings
  discounts: DiscountCode[];
  addDiscount: (discount: Omit<DiscountCode, 'id' | 'usageCount'>) => Promise<void>;
  toggleDiscount: (id: string) => void;
  deleteDiscount: (id: string) => Promise<void>;
  storeSettings: StoreSettings;
  updateStoreSettings: (updates: Partial<StoreSettings>) => Promise<void>;

  // Neon PostgreSQL Diagnostics
  neonStatus: NeonStatusData | null;
  refreshNeonStatus: () => Promise<NeonStatusData | null>;
  runNeonMigration: () => Promise<{ success: boolean; message: string }>;

  // Admin Authentication
  isAdminAuthenticated: boolean;
  adminActiveTab:
    | 'dashboard'
    | 'products'
    | 'categories'
    | 'aliexpress'
    | 'orders'
    | 'customers'
    | 'discounts'
    | 'settings'
    | 'shipping'
    | 'settlements';
  setAdminActiveTab: (
    tab:
      | 'dashboard'
      | 'products'
      | 'categories'
      | 'aliexpress'
      | 'orders'
      | 'customers'
      | 'discounts'
      | 'settings'
      | 'shipping'
      | 'settlements'
  ) => void;
  loginAdmin: (password: string) => Promise<boolean>;
  logoutAdmin: () => void;

  // Quick Actions & Feedback
  quickBuy: (product: Product, variantId?: string, quantity?: number) => void;
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Localization
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('qevorin_lang') as Language;
      return saved === 'fr' ? 'fr' : 'ar';
    }
    return 'ar';
  });

  const isRtl = language === 'ar';

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('qevorin_lang', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'fr' : 'ar');
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // Navigation
  const [currentView, setCurrentView] = useState<'home' | 'category' | 'product' | 'cart' | 'checkout' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const path = window.location.pathname.toLowerCase();
      if (
        hash === '#admin' ||
        params.get('view') === 'admin' ||
        params.get('admin') === 'true' ||
        path === '/admin' ||
        path.startsWith('/admin')
      ) {
        return 'admin';
      }
    }
    return 'home';
  });

  useEffect(() => {
    const handleUrlChange = () => {
      const hash = window.location.hash.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const path = window.location.pathname.toLowerCase();
      if (
        hash === '#admin' ||
        params.get('view') === 'admin' ||
        params.get('admin') === 'true' ||
        path === '/admin' ||
        path.startsWith('/admin')
      ) {
        setCurrentView('admin');
      }
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart Drawer & Checkout Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [lastConfirmedOrder, setLastConfirmedOrder] = useState<Order | null>(null);

  // Data State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [discounts, setDiscounts] = useState<DiscountCode[]>(INITIAL_DISCOUNTS);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(INITIAL_STORE_SETTINGS);

  // Cart (Local storage persistence for customer shopping bag)
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('qevorin_cart');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* ignore */ }
      }
    }
    return [];
  });

  // Neon PostgreSQL Diagnostics state
  const [neonStatus, setNeonStatus] = useState<NeonStatusData | null>(null);

  // Admin authentication (validated on backend)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return Boolean(getAdminToken());
  });

  const [adminActiveTab, setAdminActiveTab] = useState<
    | 'dashboard'
    | 'products'
    | 'categories'
    | 'aliexpress'
    | 'orders'
    | 'customers'
    | 'discounts'
    | 'settings'
    | 'shipping'
    | 'settlements'
  >('dashboard');

  // Checkout city & discounts
  const [selectedCity, setSelectedCity] = useState<string>('casablanca');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3800);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync cart to local storage
  useEffect(() => {
    localStorage.setItem('qevorin_cart', JSON.stringify(cart));
  }, [cart]);

  // Load backend catalog and check Neon status on mount
  useEffect(() => {
    async function loadBackendData() {
      // 1. Verify admin token if stored
      const hasValidToken = await apiVerifyAdminSession();
      setIsAdminAuthenticated(hasValidToken);

      // 2. Load products from backend API
      const prods = await apiGetProducts(hasValidToken);
      if (prods && prods.length > 0) {
        setProducts(prods);
      }

      // 3. Load categories
      const cats = await apiGetCategories();
      if (cats && cats.length > 0) {
        setCategories(cats);
      }

      // 4. Load discounts
      const discs = await apiGetDiscounts();
      if (discs && discs.length > 0) {
        setDiscounts(discs);
      }

      // 5. Load settings
      const settings = await apiGetSettings();
      if (settings) {
        setStoreSettings(settings);
      }

      // 6. Check Neon database status
      try {
        const nStatus = await apiCheckNeonStatus();
        setNeonStatus(nStatus);
      } catch (e) {
        console.warn('Neon status check failed:', e);
      }

      // 7. Load orders if admin
      if (hasValidToken) {
        try {
          const ords = await apiGetOrders();
          if (ords && ords.length > 0) {
            setOrders(ords);
          }
        } catch {
          // ignore
        }
      }
    }

    loadBackendData();
  }, []);

  const refreshNeonStatus = async (): Promise<NeonStatusData | null> => {
    try {
      const data = await apiCheckNeonStatus();
      setNeonStatus(data);
      return data;
    } catch {
      return null;
    }
  };

  const runNeonMigration = async (): Promise<{ success: boolean; message: string }> => {
    const res = await apiRunNeonMigration();
    if (res.success) {
      await refreshNeonStatus();
      // Reload products & categories
      const prods = await apiGetProducts(isAdminAuthenticated);
      if (prods.length > 0) setProducts(prods);
      const cats = await apiGetCategories();
      if (cats.length > 0) setCategories(cats);
    }
    return res;
  };

  // Cart calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartTotalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Shipping fee
  const currentCityObj = MOROCCAN_CITIES.find((c) => c.id === selectedCity);
  const baseCityShipping = currentCityObj ? currentCityObj.shippingFee : storeSettings.standardShippingFee;
  const shippingFee = cartSubtotal >= storeSettings.freeShippingThreshold ? 0 : baseCityShipping;

  // Discount calculation
  let orderDiscountAmount = 0;
  if (appliedDiscount && appliedDiscount.isActive) {
    if (!appliedDiscount.minSpend || cartSubtotal >= appliedDiscount.minSpend) {
      if (appliedDiscount.type === 'percentage') {
        orderDiscountAmount = Math.round((cartSubtotal * appliedDiscount.value) / 100);
      } else {
        orderDiscountAmount = appliedDiscount.value;
      }
    }
  }

  const finalTotal = Math.max(0, cartSubtotal + shippingFee - orderDiscountAmount);

  // Add to cart
  const addToCart = (product: Product, variantId?: string, quantity: number = 1) => {
    const chosenVariant = variantId ? product.variants.find((v) => v.id === variantId) : product.variants[0];
    const itemPrice = chosenVariant ? chosenVariant.price : product.price;
    const cartItemId = `${product.id}-${chosenVariant?.id || 'default'}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          productId: product.id,
          productTitle: product.title,
          productTitleFr: product.titleFr,
          variantId: chosenVariant?.id,
          variantName: chosenVariant?.name,
          price: itemPrice,
          quantity,
          image: product.images[0] || '',
          sku: chosenVariant?.sku || product.id,
        },
      ];
    });

    addToast(
      language === 'ar'
        ? `تمت إضافة "${product.title.slice(0, 30)}..." إلى السلة!`
        : `Ajouté au panier : "${product.titleFr.slice(0, 30)}..."`
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedDiscount(null);
  };

  const quickBuy = (product: Product, variantId?: string, quantity: number = 1) => {
    addToCart(product, variantId, quantity);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const applyDiscountCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    const found = discounts.find((d) => d.code === clean && d.isActive);
    if (!found) {
      return {
        success: false,
        message: language === 'ar' ? 'رمز التخفيض غير صالح أو منتهي الصلاحية' : 'Code promo invalide ou expiré',
      };
    }
    if (found.minSpend && cartSubtotal < found.minSpend) {
      return {
        success: false,
        message:
          language === 'ar'
            ? `الحد الأدنى لتفعيل هذا الكود هو ${found.minSpend} درهم`
            : `Montant minimum requis : ${found.minSpend} MAD`,
      };
    }
    setAppliedDiscount(found);
    return {
      success: true,
      message:
        language === 'ar'
          ? `تم تفعيل كود الخصم (${found.code}) بنجاح!`
          : `Code (${found.code}) appliqué avec succès !`,
    };
  };

  const removeDiscountCode = () => {
    setAppliedDiscount(null);
  };

  // Create order via backend API (executes database transaction)
  const createOrder = async (customer: MoroccanCustomer): Promise<Order> => {
    try {
      const savedOrder = await apiCreateOrder({
        customer,
        items: [...cart],
        subtotal: cartSubtotal,
        shippingFee,
        discountAmount: orderDiscountAmount,
        total: finalTotal,
        notes: customer.notes || '',
      });

      setOrders((prev) => [savedOrder, ...prev]);

      setLastConfirmedOrder(savedOrder);
      clearCart();
      setIsCheckoutOpen(false);

      addToast(
        language === 'ar'
          ? `تهانينا! تم تسجيل طلبيتك بنجاح برقم ${savedOrder.orderNumber}`
          : `Félicitations ! Commande enregistrée : ${savedOrder.orderNumber}`
      );

      return savedOrder;
    } catch (err: any) {
      addToast(err.message || 'فشل تسجيل الطلبية', 'error');
      throw err;
    }
  };

  // Order status update
  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const success = await apiUpdateOrderStatus(orderId, status);
    if (success) {
      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, status, updatedAt: new Date().toISOString() } : ord))
      );
      addToast(
        language === 'ar'
          ? `تم تحديث حالة الطلبية إلى: ${status}`
          : `Statut de la commande mis à jour : ${status}`
      );
    }
  };

  // Product management via API
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>) => {
    try {
      const saved = await apiCreateProduct(productData);
      if (saved) {
        setProducts((prev) => [saved, ...prev]);
        setCategories((prev) =>
          prev.map((c) => (c.id === productData.categoryId ? { ...c, productCount: c.productCount + 1 } : c))
        );
        addToast(language === 'ar' ? 'تم إضافة المنتج بنجاح!' : 'Produit ajouté avec succès !');
      }
    } catch (err: any) {
      addToast(err.message || 'فشل حفظ المنتج', 'error');
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const updated = await apiUpdateProduct(id, updates);
      if (updated) {
        setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
        addToast(language === 'ar' ? 'تم تعديل بيانات المنتج' : 'Produit modifié avec succès');
      }
    } catch (err: any) {
      addToast(err.message || 'فشل تعديل المنتج', 'error');
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const target = products.find((p) => p.id === id);
      const ok = await apiDeleteProduct(id);
      if (ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        if (target) {
          setCategories((prev) =>
            prev.map((c) => (c.id === target.categoryId ? { ...c, productCount: Math.max(0, c.productCount - 1) } : c))
          );
        }
        addToast(language === 'ar' ? 'تم حذف المنتج من المتجر' : 'Produit supprimé du catalogue');
      }
    } catch (err: any) {
      addToast(err.message || 'فشل حذف المنتج', 'error');
    }
  };

  const addCategory = async (categoryData: Omit<Category, 'id' | 'productCount'>) => {
    try {
      const newCat = await apiCreateCategory(categoryData);
      if (newCat) {
        setCategories((prev) => [...prev, newCat]);
        addToast(language === 'ar' ? 'تم إضافة التصنيف الجديد' : 'Catégorie ajoutée avec succès');
      }
    } catch (err: any) {
      addToast(err.message || 'فشل إضافة التصنيف', 'error');
    }
  };

  // Discounts
  const addDiscount = async (discountData: Omit<DiscountCode, 'id' | 'usageCount'>) => {
    try {
      const newDisc = await apiCreateDiscount(discountData);
      if (newDisc) {
        setDiscounts((prev) => [newDisc, ...prev]);
        addToast(language === 'ar' ? 'تم إنشاء كود الخصم الجديد' : 'Nouveau code promo créé');
      }
    } catch (err: any) {
      addToast(err.message || 'فشل إنشاء الكود', 'error');
    }
  };

  const toggleDiscount = (id: string) => {
    setDiscounts((prev) => prev.map((d) => (d.id === id ? { ...d, isActive: !d.isActive } : d)));
  };

  const deleteDiscount = async (id: string) => {
    try {
      const ok = await apiDeleteDiscount(id);
      if (ok) {
        setDiscounts((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err: any) {
      addToast(err.message || 'فشل حذف الكود', 'error');
    }
  };

  const updateStoreSettings = async (updates: Partial<StoreSettings>) => {
    try {
      const saved = await apiUpdateSettings(updates);
      if (saved) {
        setStoreSettings(saved);
        addToast(language === 'ar' ? 'تم حفظ إعدادات المتجر' : 'Paramètres de la boutique enregistrés');
      }
    } catch (err: any) {
      addToast(err.message || 'فشل حفظ الإعدادات', 'error');
    }
  };

  // Admin login via server
  const loginAdmin = async (password: string): Promise<boolean> => {
    try {
      const res = await apiAdminLogin(password);
      if (res.success && res.token) {
        setIsAdminAuthenticated(true);
        addToast(
          language === 'ar'
            ? 'تم تسجيل الدخول إلى لوحة إدارة كيفورين بنجاح'
            : 'Connexion à l’administration réussie'
        );
        // Refresh orders and diagnostic state
        const ords = await apiGetOrders();
        setOrders(ords);
        await refreshNeonStatus();
        return true;
      }
      addToast(res.error || (language === 'ar' ? 'كلمة المرور غير صحيحة' : 'Mot de passe incorrect'), 'error');
      return false;
    } catch (err: any) {
      addToast(err.message || 'خطأ في المصادقة', 'error');
      return false;
    }
  };

  const logoutAdmin = () => {
    setAdminToken(null);
    setIsAdminAuthenticated(false);
    setCurrentView('home');
    addToast(language === 'ar' ? 'تم تسجيل الخروج' : 'Déconnexion réussie', 'info');
  };

  return (
    <StoreContext.Provider
      value={{
        currentView,
        setCurrentView,
        selectedCategoryId,
        setSelectedCategoryId,
        selectedProductId,
        setSelectedProductId,
        searchQuery,
        setSearchQuery,
        language,
        setLanguage,
        toggleLanguage,
        isRtl,
        products,
        categories,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        cartSubtotal,
        cartTotalQuantity,
        selectedCity,
        setSelectedCity,
        appliedDiscount,
        applyDiscountCode,
        removeDiscountCode,
        shippingFee,
        orderDiscountAmount,
        finalTotal,
        isCheckoutOpen,
        setIsCheckoutOpen,
        lastConfirmedOrder,
        setLastConfirmedOrder,
        createOrder,
        orders,
        updateOrderStatus,
        discounts,
        addDiscount,
        toggleDiscount,
        deleteDiscount,
        storeSettings,
        updateStoreSettings,
        neonStatus,
        refreshNeonStatus,
        runNeonMigration,
        isAdminAuthenticated,
        adminActiveTab,
        setAdminActiveTab,
        loginAdmin,
        logoutAdmin,
        quickBuy,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
