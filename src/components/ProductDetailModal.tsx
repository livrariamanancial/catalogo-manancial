import { Product, StoreSettings } from '../types';
import { 
  X, 
  ShoppingBag, 
  MessageCircle, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  BookOpen, 
  Building, 
  Barcode, 
  Tag, 
  Clock 
} from 'lucide-react';
import { generateSingleProductWhatsAppUrl } from '../services/api';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  cartQuantity: number;
  storeSettings: StoreSettings;
}

export function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  cartQuantity,
  storeSettings,
}: ProductDetailModalProps) {
  if (!product) return null;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;
  const hasPromo = !!product.promotionalPrice && product.promotionalPrice < product.price;
  const effectivePrice = product.promotionalPrice || product.price;
  const discountPercent = hasPromo
    ? Math.round(((product.price - product.promotionalPrice!) / product.price) * 100)
    : 0;

  const directWaUrl = generateSingleProductWhatsAppUrl(product, storeSettings);

  return (
    <div
      id="product-detail-modal-backdrop"
      className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="product-detail-modal-container"
        className="relative w-full max-w-3xl bg-[#FDFCFB] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-product-detail-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-stone-100/90 text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors shadow-xs"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Left Column: Image Area */}
          <div className="md:col-span-5 bg-stone-100/90 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-stone-200 relative">
            {/* Stock Ribbon */}
            <div className="absolute top-4 left-4 z-10">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-sans font-bold uppercase tracking-wider bg-red-600 text-white shadow-xs">
                  <XCircle className="w-3.5 h-3.5" />
                  Esgotado
                </span>
              ) : isLowStock ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-sans font-bold uppercase tracking-wider bg-amber-400 text-stone-950 shadow-xs animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Últimas {product.stock} un.
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-sans font-bold uppercase tracking-wider bg-white text-stone-900 shadow-xs border border-stone-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {product.stock} em estoque
                </span>
              )}
            </div>

            {/* Cover Image */}
            <img
              src={product.coverImage}
              alt={product.name}
              className="w-full max-w-[240px] aspect-[3/4] object-cover rounded-xl shadow-lg border border-stone-200"
              onError={(e) => {
                (e.target as HTMLElement).setAttribute(
                  'src',
                  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800'
                );
              }}
            />

            {/* Bling SKU badge */}
            <div className="mt-4 flex items-center gap-2 text-[11px] font-sans text-stone-500 bg-white px-3 py-1 rounded-full border border-stone-200">
              <Barcode className="w-3.5 h-3.5 text-stone-400" />
              <span>SKU: <strong className="font-mono text-stone-800">{product.sku}</strong></span>
            </div>
          </div>

          {/* Right Column: Information & Actions */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Category & Publisher */}
              <div className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">
                <span>{product.category}</span>
                {product.subcategory && (
                  <>
                    <span>•</span>
                    <span className="text-stone-600">{product.subcategory}</span>
                  </>
                )}
              </div>

              {/* Title */}
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                {product.name}
              </h2>

              {/* Author & Publisher */}
              <div className="flex flex-wrap items-center gap-2 text-stone-600 italic text-sm sm:text-base">
                <span>{product.author || 'Autor da Obra'}</span>
                {product.publisher && (
                  <>
                    <span className="text-stone-300 not-italic">•</span>
                    <span className="text-stone-500 not-italic font-sans text-xs">
                      {product.publisher}
                    </span>
                  </>
                )}
              </div>

              {/* Price Row */}
              <div className="pt-2 flex items-baseline gap-3">
                {hasPromo && (
                  <span className="font-sans text-sm text-stone-400 line-through">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </span>
                )}
                <span className="font-sans text-2xl sm:text-3xl font-bold text-stone-900">
                  R$ {effectivePrice.toFixed(2).replace('.', ',')}
                </span>
                {discountPercent > 0 && (
                  <span className="px-2 py-0.5 rounded-md font-sans text-xs font-bold bg-rose-600 text-white">
                    -{discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5 pt-2">
                <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">
                  Sinopse & Detalhes
                </h4>
                <p className="font-serif text-sm text-stone-700 leading-relaxed italic">
                  {product.description ||
                    'Obra clássica essencial para o enriquecimento espiritual, estudos bíblicos aprofundados e comunhão com a Palavra de Deus.'}
                </p>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-sans text-stone-600">
                {product.versionOrTranslation && (
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-400 block uppercase tracking-wider">Versão Bíblica</span>
                    <span className="font-bold text-stone-900">{product.versionOrTranslation}</span>
                  </div>
                )}
                {product.format && (
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-400 block uppercase tracking-wider">Acabamento</span>
                    <span className="font-bold text-stone-900">{product.format}</span>
                  </div>
                )}
                {product.pages && (
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-400 block uppercase tracking-wider">Páginas</span>
                    <span className="font-bold text-stone-900">{product.pages} págs.</span>
                  </div>
                )}
                {product.isbn && (
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-400 block uppercase tracking-wider">ISBN / EAN</span>
                    <span className="font-mono text-stone-800">{product.isbn}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4 border-t border-stone-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Add to Cart */}
                <button
                  id="modal-add-to-cart-btn"
                  onClick={() => onAddToCart(product, 1)}
                  disabled={isOutOfStock || cartQuantity >= product.stock}
                  className={`w-full py-3.5 px-4 rounded-full font-sans text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm ${
                    isOutOfStock
                      ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                      : cartQuantity > 0
                      ? 'bg-emerald-800 hover:bg-emerald-900 text-white'
                      : 'bg-stone-900 hover:bg-stone-800 text-white active:scale-95'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {isOutOfStock
                      ? 'Indisponível no Estoque'
                      : cartQuantity > 0
                      ? `No Carrinho (${cartQuantity})`
                      : 'Adicionar ao Carrinho'}
                  </span>
                </button>

                {/* Direct WhatsApp Consultation */}
                <a
                  id="modal-direct-whatsapp-btn"
                  href={directWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full font-sans text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Chamar no WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
