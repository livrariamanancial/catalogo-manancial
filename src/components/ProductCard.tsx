import { Product, StoreSettings } from '../types';
import { ShoppingBag, Eye, MessageCircle, Tag } from 'lucide-react';
import { generateSingleProductWhatsAppUrl } from '../services/api';

interface ProductCardProps {
  key?: string | number;
  product: Product;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  cartQuantity: number;
  storeSettings: StoreSettings;
}

export function ProductCard({
  product,
  onSelectProduct,
  onAddToCart,
  cartQuantity,
  storeSettings,
}: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;
  const hasPromo = !!product.promotionalPrice && product.promotionalPrice < product.price;
  const effectivePrice = product.promotionalPrice || product.price;
  const discountPercent = hasPromo
    ? Math.round(((product.price - product.promotionalPrice!) / product.price) * 100)
    : 0;

  const directWaUrl = generateSingleProductWhatsAppUrl(product, storeSettings);

  return (
    <article
      id={`product-card-${product.id}`}
      className="group flex flex-col bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs hover:shadow-xl transition-all duration-300 relative justify-between"
    >
      {/* Top Section: Cover & Metadata */}
      <div>
        {/* Cover Image Frame (Artistic Flair) */}
        <div 
          onClick={() => onSelectProduct(product)}
          className="aspect-[3/4] bg-stone-100 mb-4 overflow-hidden rounded-xl shadow-xs group-hover:shadow-md transition-all relative cursor-pointer flex items-center justify-center"
        >
          {/* Top Right Stock Badge */}
          {isOutOfStock ? (
            <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 text-[10px] font-sans font-bold uppercase tracking-tighter rounded-md shadow-xs z-10">
              Esgotado
            </div>
          ) : isLowStock ? (
            <div className="absolute top-3 right-3 bg-amber-400 text-stone-950 px-2 py-1 text-[10px] font-sans font-bold uppercase tracking-tighter rounded-md shadow-xs z-10 animate-pulse">
              Últimas {product.stock} un.
            </div>
          ) : (
            <div className="absolute top-3 right-3 bg-white/95 text-stone-900 px-2.5 py-1 text-[10px] font-sans font-bold uppercase tracking-tighter rounded-md shadow-xs border border-stone-200/80 z-10">
              {product.stock} em estoque
            </div>
          )}

          {/* Discount Ribbon (Top Left) */}
          {discountPercent > 0 && (
            <div className="absolute top-3 left-3 bg-rose-600 text-white px-2 py-0.5 text-[9px] font-sans font-bold uppercase tracking-wider rounded-md shadow-xs z-10 flex items-center gap-1">
              <Tag className="w-2.5 h-2.5" />
              -{discountPercent}% OFF
            </div>
          )}

          {/* Book Cover Image */}
          <img
            src={product.coverImage}
            alt={product.name}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              isOutOfStock ? 'opacity-40 grayscale' : 'opacity-90'
            }`}
            onError={(e) => {
              (e.target as HTMLElement).setAttribute(
                'src',
                'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800'
              );
            }}
          />

          {/* Quick View Button on Hover */}
          <div className="absolute inset-0 bg-stone-950/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none sm:pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectProduct(product);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-stone-900 rounded-full font-sans text-xs font-semibold shadow-lg hover:bg-stone-100 transition-transform scale-95 group-hover:scale-100"
            >
              <Eye className="w-3.5 h-3.5 text-stone-700" />
              Ver Detalhes
            </button>
          </div>
        </div>

        {/* Title & Author */}
        <h4
          onClick={() => onSelectProduct(product)}
          className={`font-serif text-lg font-bold leading-tight cursor-pointer hover:text-stone-700 transition-colors line-clamp-2 ${
            isOutOfStock ? 'text-stone-400' : 'text-stone-900'
          }`}
          title={product.name}
        >
          {product.name}
        </h4>

        <p className="text-stone-500 italic text-xs sm:text-sm mt-1 line-clamp-1">
          {product.author || product.publisher}
        </p>

        {product.versionOrTranslation && (
          <span className="inline-block mt-1 font-sans text-[10px] uppercase tracking-wider text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
            {product.versionOrTranslation}
          </span>
        )}
      </div>

      {/* Pricing & Add to Cart Action Row (Artistic Flair pattern) */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
        <div className="flex flex-col">
          {hasPromo && (
            <span className="font-sans text-[10px] text-stone-400 line-through">
              R$ {product.price.toFixed(2).replace('.', ',')}
            </span>
          )}
          <span
            className={`font-sans font-bold text-base sm:text-lg ${
              isOutOfStock ? 'text-stone-400' : 'text-stone-900'
            }`}
          >
            R$ {effectivePrice.toFixed(2).replace('.', ',')}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <a
            id={`direct-whatsapp-btn-${product.id}`}
            href={directWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Perguntar no WhatsApp"
            className="p-2 rounded-lg bg-stone-100 hover:bg-emerald-50 text-stone-600 hover:text-emerald-700 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
          </a>

          <button
            id={`add-to-cart-btn-${product.id}`}
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock || cartQuantity >= product.stock}
            className={`font-sans text-[10px] uppercase tracking-widest px-3.5 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 font-bold ${
              isOutOfStock
                ? 'border border-stone-200 text-stone-300 cursor-not-allowed bg-transparent'
                : cartQuantity > 0
                ? 'bg-emerald-800 hover:bg-emerald-900 text-white'
                : 'bg-stone-900 text-white hover:bg-stone-700'
            }`}
          >
            <ShoppingBag className="w-3 h-3" />
            <span>
              {isOutOfStock
                ? 'Indisponível'
                : cartQuantity > 0
                ? `No Carrinho (${cartQuantity})`
                : 'Adicionar'}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}
