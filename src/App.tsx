import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Product, 
  CartItem, 
  FilterState, 
  StoreSettings, 
  BlingConfig, 
  CategoryId 
} from './types';
import { 
  INITIAL_CATEGORIES, 
  INITIAL_STORE_SETTINGS, 
  INITIAL_BLING_CONFIG, 
  INITIAL_PRODUCTS 
} from './data/initialCatalog';
import { 
  fetchCatalog, 
  fetchStoreConfig, 
  triggerBlingSync,
  generateWhatsAppOrderUrl
} from './services/api';

import { Header } from './components/Header';
import { CategoryNav } from './components/CategoryNav';
import { HeroBanner } from './components/HeroBanner';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { BlingSettingsModal } from './components/BlingSettingsModal';
import { FiltersSidebar } from './components/FiltersSidebar';
import { MobileFilterDrawer } from './components/MobileFilterDrawer';
import { Footer } from './components/Footer';

import { 
  ShoppingBag, 
  BookOpen, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Search,
  MessageCircle,
  ArrowRight
} from 'lucide-react';

const INITIAL_FILTERS: FilterState = {
  search: '',
  category: 'todos',
  subcategory: '',
  inStockOnly: false,
  minPrice: 0,
  maxPrice: 0,
  publisher: '',
  format: '',
  version: '',
  sortBy: 'relevance',
};

export default function App() {
  // Products & Configuration States
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(INITIAL_STORE_SETTINGS);
  const [blingConfig, setBlingConfig] = useState<BlingConfig>(INITIAL_BLING_CONFIG);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncAt, setLastSyncAt] = useState<string>(new Date().toISOString());

  // Filter States
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // Cart State (Persisted in localStorage)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('manancial_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI Modal States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isBlingModalOpen, setIsBlingModalOpen] = useState<boolean>(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Save Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('manancial_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart:', e);
    }
  }, [cartItems]);

  // Toast Notification helper
  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Catalog and Settings on Mount
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [catalogRes, configRes] = await Promise.all([
        fetchCatalog(filters),
        fetchStoreConfig(),
      ]);

      if (catalogRes?.products) {
        setProducts(catalogRes.products);
        if (catalogRes.lastSyncAt) setLastSyncAt(catalogRes.lastSyncAt);
      }
      if (configRes?.store) setStoreSettings(configRes.store);
      if (configRes?.bling) setBlingConfig(configRes.bling);
    } catch (err) {
      console.warn('Usando catálogo pré-carregado:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto Sync Interval (if configured)
  useEffect(() => {
    if (!blingConfig.autoSync || !blingConfig.syncIntervalMinutes) return;
    const intervalMs = Math.max(1, blingConfig.syncIntervalMinutes) * 60 * 1000;

    const intervalId = setInterval(async () => {
      try {
        const res = await triggerBlingSync();
        if (res.success) {
          const catalogRes = await fetchCatalog(filters);
          if (catalogRes?.products) setProducts(catalogRes.products);
          setLastSyncAt(res.timestamp);
        }
      } catch (err) {
        console.error('Auto sync error:', err);
      }
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [blingConfig.autoSync, blingConfig.syncIntervalMinutes, filters]);

  // Instant Sync Handler
  const handleInstantSync = async () => {
    setIsSyncing(true);
    try {
      const res = await triggerBlingSync();
      showToast(res.message, 'success');
      const catalogRes = await fetchCatalog(filters);
      if (catalogRes?.products) setProducts(catalogRes.products);
      setLastSyncAt(res.timestamp);
    } catch (err: any) {
      showToast('Erro ao sincronizar com Bling ERP', 'info');
    } finally {
      setIsSyncing(false);
    }
  };

  // Cart Actions
  const handleAddToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) {
      showToast('Item esgotado no estoque do Bling ERP', 'info');
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.stock);
        showToast(`Adicionado mais ${quantity}x "${product.name}" ao carrinho`, 'success');
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      } else {
        showToast(`"${product.name}" adicionado ao carrinho!`, 'success');
        return [...prev, { product, quantity: Math.min(quantity, product.stock) }];
      }
    });
  };

  const handleUpdateCartQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const clampedQty = Math.min(newQty, item.product.stock);
          return { ...item, quantity: clampedQty };
        }
        return item;
      })
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('Item removido do carrinho', 'info');
  };

  const handleClearCart = () => {
    setCartItems([]);
    showToast('Carrinho esvaziado', 'info');
  };

  // Filter Extraction
  const availablePublishers = useMemo(() => {
    const pubs = new Set<string>();
    products.forEach((p) => {
      if (p.publisher) pubs.add(p.publisher);
    });
    return Array.from(pubs).sort();
  }, [products]);

  const availableFormats = useMemo(() => {
    const fmts = new Set<string>();
    products.forEach((p) => {
      if (p.format) fmts.add(p.format);
    });
    return Array.from(fmts).sort();
  }, [products]);

  const inStockCount = useMemo(() => {
    return products.filter((p) => p.stock > 0).length;
  }, [products]);

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Cart metrics for floating bar
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cartItems.reduce(
    (acc, item) => acc + (item.product.promotionalPrice || item.product.price) * item.quantity,
    0
  );

  const getCategoryTitle = (catId: CategoryId) => {
    if (catId === 'todos') return 'Catálogo Completo';
    const found = INITIAL_CATEGORIES.find((c) => c.id === catId);
    return found ? found.name : catId;
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1C1917] flex flex-col font-serif selection:bg-stone-900 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          id="app-toast-notification"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-stone-900 text-white font-sans text-xs font-medium rounded-2xl shadow-2xl border border-stone-700 animate-in slide-in-from-bottom-5 duration-200"
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <Header
        searchQuery={filters.search}
        onSearchChange={(search) => handleFilterChange({ search })}
        cartItems={cartItems}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenBlingModal={() => setIsBlingModalOpen(true)}
        onOpenMobileFilters={() => setIsMobileFiltersOpen(true)}
        storeSettings={storeSettings}
        blingConfig={blingConfig}
        isSyncing={isSyncing}
        onInstantSync={handleInstantSync}
        onResetFilters={handleResetFilters}
      />

      {/* Categories Navigation */}
      <CategoryNav
        categories={INITIAL_CATEGORIES}
        selectedCategory={filters.category}
        selectedSubcategory={filters.subcategory}
        onSelectCategory={(category) => handleFilterChange({ category })}
        onSelectSubcategory={(subcategory) => handleFilterChange({ subcategory })}
      />

      {/* Hero Banner */}
      <HeroBanner
        storeSettings={storeSettings}
        totalProducts={products.length}
        inStockCount={inStockCount}
        lastSyncAt={lastSyncAt}
        onScrollToCatalog={() => {
          document.getElementById('catalog-grid-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Main Catalog Section */}
      <main id="catalog-grid-section" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Desktop Filters Sidebar */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-28">
              <FiltersSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                availablePublishers={availablePublishers}
                availableFormats={availableFormats}
                totalResults={products.length}
              />
            </div>
          </div>

          {/* Right Column: Catalog Grid & Search Header */}
          <div className="lg:col-span-9 space-y-8">
            {/* Catalog Editorial Section Header (Artistic Flair) */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 pb-5">
              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light italic text-stone-900 tracking-tight">
                  Catálogo{' '}
                  <span className="font-bold not-italic">
                    {getCategoryTitle(filters.category)}
                  </span>
                </h2>
                {filters.subcategory && (
                  <p className="font-sans text-xs uppercase tracking-widest text-stone-500 font-semibold mt-1">
                    Filtrado por: <span className="text-stone-900">{filters.subcategory}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="font-sans text-xs text-stone-400">
                  Exibindo <strong>{products.length}</strong> resultados
                </span>

                {(filters.search || filters.category !== 'todos' || filters.inStockOnly || filters.publisher || filters.format) && (
                  <button
                    id="catalog-header-clear-filters"
                    onClick={handleResetFilters}
                    className="font-sans text-[11px] uppercase tracking-wider text-stone-500 hover:text-stone-900 underline font-semibold ml-2"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            </div>

            {/* Active search tag */}
            {filters.search && (
              <div className="flex items-center gap-2 font-sans text-xs">
                <span className="text-stone-400">Buscando por:</span>
                <span className="inline-flex items-center gap-1.5 bg-stone-100 text-stone-900 px-3 py-1 rounded-full border border-stone-200 font-medium">
                  <Search className="w-3 h-3 text-stone-500" />
                  &ldquo;{filters.search}&rdquo;
                </span>
              </div>
            )}

            {/* Product Grid / Loading / Empty */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <RefreshCw className="w-8 h-8 text-stone-900 animate-spin" />
                <p className="font-sans text-xs uppercase tracking-widest text-stone-500">
                  Consultando estoque em tempo real no Bling ERP...
                </p>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-3xl p-14 text-center border border-stone-200 space-y-5">
                <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif font-bold text-stone-900">
                    Nenhum título encontrado
                  </h3>
                  <p className="font-sans text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                    Tente buscar por outro termo, selecionar outra categoria ou desmarcar o filtro de estoque.
                  </p>
                </div>
                <button
                  id="empty-results-reset-btn"
                  onClick={handleResetFilters}
                  className="font-sans px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-xs uppercase tracking-widest font-bold shadow-sm"
                >
                  Ver Catálogo Completo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                {products.map((product) => {
                  const cartItem = cartItems.find((ci) => ci.product.id === product.id);
                  const cartQty = cartItem ? cartItem.quantity : 0;

                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelectProduct={(p) => setSelectedProduct(p)}
                      onAddToCart={(p) => handleAddToCart(p, 1)}
                      cartQuantity={cartQty}
                      storeSettings={storeSettings}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Bottom Cart Bar (Artistic Flair Footer Bar with WhatsApp action) */}
      {totalCartCount > 0 && (
        <div 
          id="mobile-sticky-cart-bar"
          className="fixed bottom-0 inset-x-0 z-40 bg-stone-900 text-white py-3.5 px-4 sm:px-8 border-t border-stone-800 shadow-[0_-10px_25px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Left: Avatar Stack & Cart Metrics */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Product Cover Thumbnails Stack */}
              <div className="flex -space-x-3 shrink-0">
                {cartItems.slice(0, 3).map((item, idx) => (
                  <div 
                    key={item.product.id}
                    className="w-10 h-10 rounded-full border-2 border-stone-900 bg-stone-800 overflow-hidden shadow-sm"
                    title={item.product.name}
                  >
                    <img 
                      src={item.product.coverImage} 
                      alt={item.product.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ))}
              </div>

              <div>
                <p className="font-sans text-[10px] uppercase tracking-widest text-stone-400 font-semibold">
                  Seu Carrinho
                </p>
                <p className="text-sm font-serif font-bold text-white">
                  {totalCartCount} {totalCartCount === 1 ? 'item selecionado' : 'itens selecionados'} •{' '}
                  <span className="text-stone-300 font-normal italic font-serif">
                    R$ {cartSubtotal.toFixed(2).replace('.', ',')}
                  </span>
                </p>
              </div>
            </div>

            {/* Right: Dual Actions (Open Drawer / Direct WhatsApp) */}
            <div className="flex items-center gap-2.5">
              <button
                id="sticky-cart-review-btn"
                onClick={() => setIsCartOpen(true)}
                className="hidden sm:inline-flex font-sans text-xs uppercase tracking-wider text-stone-300 hover:text-white px-4 py-2.5 rounded-full border border-stone-700 hover:border-stone-500 transition-colors"
              >
                Revisar Itens
              </button>

              <button
                id="sticky-cart-whatsapp-btn"
                onClick={() => {
                  const waUrl = generateWhatsAppOrderUrl(cartItems, storeSettings);
                  window.open(waUrl, '_blank');
                }}
                className="bg-[#25D366] hover:bg-[#128C7E] text-white px-5 sm:px-7 py-3 rounded-full flex items-center gap-2.5 transition-all transform active:scale-95 shadow-md font-sans font-bold uppercase tracking-widest text-xs"
              >
                <MessageCircle className="w-4 h-4 fill-white shrink-0" />
                <span className="hidden sm:inline">Enviar para WhatsApp</span>
                <span className="sm:hidden">WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        cartQuantity={
          selectedProduct
            ? cartItems.find((ci) => ci.product.id === selectedProduct.id)?.quantity || 0
            : 0
        }
        storeSettings={storeSettings}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        storeSettings={storeSettings}
      />

      {/* Bling Settings & Real-time Stock Sync Modal */}
      <BlingSettingsModal
        isOpen={isBlingModalOpen}
        onClose={() => setIsBlingModalOpen(false)}
        blingConfig={blingConfig}
        storeSettings={storeSettings}
        products={products}
        onConfigUpdated={(store, bling) => {
          setStoreSettings(store);
          setBlingConfig(bling);
          showToast('Configurações salvas com sucesso!', 'success');
        }}
        onProductsUpdated={() => {
          loadData();
          showToast('Estoque atualizado em tempo real!', 'success');
        }}
      />

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={isMobileFiltersOpen}
        onClose={() => setIsMobileFiltersOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        availablePublishers={availablePublishers}
        availableFormats={availableFormats}
        totalResults={products.length}
      />

      {/* Footer */}
      <Footer
        storeSettings={storeSettings}
        onSelectCategory={(catId) => {
          handleFilterChange({ category: catId, subcategory: '' });
          window.scrollTo({ top: 300, behavior: 'smooth' });
        }}
        onOpenBlingModal={() => setIsBlingModalOpen(true)}
      />
    </div>
  );
}
