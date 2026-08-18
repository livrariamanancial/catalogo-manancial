import { StoreSettings } from '../types';
import { Sparkles, MessageCircle, Clock, BookOpen, ArrowDown } from 'lucide-react';

interface HeroBannerProps {
  storeSettings: StoreSettings;
  totalProducts: number;
  inStockCount: number;
  lastSyncAt: string;
  onScrollToCatalog: () => void;
}

export function HeroBanner({
  storeSettings,
  totalProducts,
  inStockCount,
  lastSyncAt,
  onScrollToCatalog,
}: HeroBannerProps) {
  const cleanPhone = storeSettings.whatsappNumber.replace(/\D/g, '');
  const waUrl = `https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`}?text=${encodeURIComponent(
    'Olá! Gostaria de consultar um livro específico no estoque da Livraria Manancial.'
  )}`;

  const formattedSyncTime = new Date(lastSyncAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <section aria-label="Apresentação do Catálogo" className="w-full bg-[#FDFCFB] border-b border-stone-200/90 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          {/* Main Editorial Headline */}
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-stone-500 font-semibold">
                Livraria & Distribuidora Cristã
              </span>
              <span className="text-stone-300">•</span>
              <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-emerald-700 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                Estoque Bling Ativo
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light italic text-[#1C1917] tracking-tight leading-[1.1]">
              Catálogo <span className="font-bold not-italic">Livraria Manancial</span>
            </h1>

            <p className="font-serif text-base sm:text-lg text-stone-600 leading-relaxed italic">
              Bíblias de estudo, devocionais e literatura cristã com consulta de estoque em tempo real e finalização direta pelo WhatsApp.
            </p>
          </div>

          {/* Quick Stats & WhatsApp Inquiry Bar */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 lg:gap-4">
            <div className="p-3.5 bg-white border border-stone-200 rounded-2xl shadow-xs flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-sans uppercase tracking-wider text-stone-400 font-semibold">Catálogo</div>
                <div className="text-sm font-serif font-bold text-stone-900">
                  {totalProducts} títulos ({inStockCount} prontos)
                </div>
              </div>
            </div>

            <a
              id="hero-whatsapp-consult-btn"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-5 py-3.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl font-sans text-xs font-bold uppercase tracking-widest transition-all shadow-sm active:scale-95 shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Falar no WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
