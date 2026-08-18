import { Search, ShoppingBag, RefreshCw, SlidersHorizontal, MessageCircle, X } from 'lucide-react';
import { Logo } from './Logo';
import { StoreSettings, BlingConfig, CartItem } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  cartItems: CartItem[];
  onOpenCart: () => void;
  onOpenBlingModal: () => void;
  onOpenMobileFilters: () => void;
  storeSettings: StoreSettings;
  blingConfig: BlingConfig;
  isSyncing: boolean;
  onInstantSync: () => void;
  onResetFilters: () => void;
}

export function Header({
  searchQuery,
  onSearchChange,
  cartItems,
  onOpenCart,
  onOpenBlingModal,
  onOpenMobileFilters,
  storeSettings,
  blingConfig,
  isSyncing,
  onInstantSync,
  onResetFilters,
}: HeaderProps) {
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cartItems.reduce(
    (acc, item) => acc + (item.product.promotionalPrice || item.product.price) * item.quantity,
    0
  );

  const cleanPhone = storeSettings.whatsappNumber.replace(/\D/g, '');
  const waUrl = `https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`}?text=${encodeURIComponent(
    'Olá! Estou navegando no catálogo online da Livraria Manancial e gostaria de tirar uma dúvida.'
  )}`;

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-[#FDFCFB]/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      {/* Top Micro-Bar (Artistic Flair) */}
      <div className="bg-stone-900 text-stone-300 font-sans text-[11px] uppercase tracking-widest py-1.5 px-4 sm:px-8 border-b border-stone-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-stone-400">Sincronização: <strong className="text-stone-200 font-bold">Bling ERP</strong></span>
            <span className="text-stone-600">•</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-emerald-400 font-semibold lowercase tracking-normal">Estoque em tempo real</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              id="header-top-whatsapp-link"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-stone-300 hover:text-emerald-400 transition-colors lowercase tracking-normal"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp: {storeSettings.displayPhone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div onClick={onResetFilters} className="shrink-0">
            <Logo size="md" />
          </div>

          {/* Search Input (Desktop & Tablet) */}
          <div className="hidden sm:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <input
                id="search-input-desktop"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar por título, autor, versão ou SKU..."
                className="w-full bg-stone-100/90 border border-stone-200/80 rounded-full py-2.5 pl-5 pr-10 text-xs sm:text-sm font-sans text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 transition-all"
              />
              {searchQuery ? (
                <button
                  id="clear-search-button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-800"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              )}
            </div>
          </div>

          {/* Action Area */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Bling ERP Settings Trigger */}
            <button
              id="bling-settings-button"
              onClick={onOpenBlingModal}
              title="Gerenciar conexão Bling ERP"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-sans font-semibold uppercase tracking-wider text-stone-700 bg-stone-100 hover:bg-stone-200/80 rounded-full border border-stone-200 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="hidden md:inline">Bling API</span>
              <span className="md:hidden">Bling</span>
              {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-emerald-700 ml-0.5" />}
            </button>

            {/* Quick Sync */}
            <button
              id="quick-sync-button"
              onClick={onInstantSync}
              disabled={isSyncing}
              title="Atualizar estoque agora"
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full border border-stone-200 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-700' : ''}`} />
            </button>

            {/* Mobile Filters Trigger */}
            <button
              id="mobile-filters-trigger"
              onClick={onOpenMobileFilters}
              className="lg:hidden p-2 text-stone-700 hover:bg-stone-100 rounded-full border border-stone-200"
              title="Filtros"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Cart Button */}
            <button
              id="cart-drawer-trigger"
              onClick={onOpenCart}
              className="relative flex items-center gap-2.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-full font-sans transition-all active:scale-95 shadow-sm"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 bg-emerald-500 text-white text-[10px] font-bold h-4.5 min-w-4.5 px-1 rounded-full flex items-center justify-center border-2 border-stone-900">
                    {totalCartCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-none text-left">
                <span className="text-[9px] text-stone-400 uppercase tracking-widest font-semibold">Carrinho</span>
                <span className="text-xs font-serif font-bold italic text-white">
                  {totalCartCount === 0 ? 'Vazio' : `R$ ${cartSubtotal.toFixed(2).replace('.', ',')}`}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-3 sm:hidden">
          <div className="relative w-full">
            <input
              id="search-input-mobile"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por título, autor ou SKU..."
              className="w-full bg-stone-100 border border-stone-200 rounded-full py-2 px-4 pr-10 text-xs font-sans text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
            {searchQuery ? (
              <button
                id="clear-search-mobile-button"
                onClick={() => onSearchChange('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
