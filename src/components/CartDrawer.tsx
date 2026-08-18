import { useState } from 'react';
import { CartItem, StoreSettings } from '../types';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  MessageCircle, 
  ShoppingBag, 
  Send,
  Truck,
  Building,
  CreditCard,
  QrCode
} from 'lucide-react';
import { generateWhatsAppOrderUrl } from '../services/api';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, newQty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  storeSettings: StoreSettings;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  storeSettings,
}: CartDrawerProps) {
  const [customerName, setCustomerName] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery' | 'shipping'>('pickup');
  const [paymentPreference, setPaymentPreference] = useState<'pix' | 'card' | 'cash'>('pix');
  const [customerNotes, setCustomerNotes] = useState('');

  if (!isOpen) return null;

  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce(
    (acc, item) => acc + (item.product.promotionalPrice || item.product.price) * item.quantity,
    0
  );

  const handleSendToWhatsApp = () => {
    const waUrl = generateWhatsAppOrderUrl(items, storeSettings, {
      customerName,
      orderType: deliveryMethod,
      paymentMethod: paymentPreference,
      notes: customerNotes,
    });
    window.open(waUrl, '_blank');
  };

  return (
    <div
      id="cart-drawer-backdrop"
      className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex justify-end transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        id="cart-drawer-panel"
        className="w-full max-w-md bg-[#FDFCFB] h-full shadow-2xl flex flex-col justify-between overflow-hidden border-l border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Deep Charcoal Stone-900) */}
        <div className="p-5 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-emerald-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold">Seu Carrinho</h3>
              <p className="font-sans text-[10px] uppercase tracking-widest text-stone-400">
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'} selecionados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                id="clear-cart-btn"
                onClick={onClearCart}
                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition-colors"
                title="Esvaziar carrinho"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              id="close-cart-btn"
              onClick={onClose}
              className="p-1.5 rounded-full bg-stone-800 text-stone-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {items.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-lg text-stone-900">
                  Seu carrinho está vazio
                </h4>
                <p className="font-sans text-xs text-stone-500 max-w-xs mx-auto">
                  Navegue pelas Bíblias e livros do catálogo e adicione os títulos desejados para encaminhar via WhatsApp.
                </p>
              </div>
              <button
                onClick={onClose}
                className="font-sans px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs uppercase tracking-wider font-semibold hover:bg-stone-800"
              >
                Explorar Catálogo
              </button>
            </div>
          ) : (
            <>
              {/* Product list */}
              <div className="space-y-3">
                <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold block">
                  Itens Selecionados
                </span>
                {items.map(({ product, quantity }) => {
                  const effectivePrice = product.promotionalPrice || product.price;
                  const itemTotal = effectivePrice * quantity;

                  return (
                    <div
                      key={product.id}
                      className="p-3 bg-white rounded-xl border border-stone-200 flex gap-3 items-center shadow-xs"
                    >
                      {/* Product Thumbnail */}
                      <img
                        src={product.coverImage}
                        alt={product.name}
                        className="w-14 h-18 object-cover rounded-lg shrink-0 bg-stone-100 shadow-xs"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif font-bold text-xs sm:text-sm text-stone-900 truncate">
                          {product.name}
                        </h4>
                        <p className="text-[11px] text-stone-500 italic truncate">
                          {product.author || product.publisher}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-sans font-bold text-xs text-stone-900">
                            R$ {effectivePrice.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="font-sans text-[10px] text-stone-400">
                            (Total: R$ {itemTotal.toFixed(2).replace('.', ',')})
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button
                          onClick={() => onRemoveItem(product.id)}
                          className="text-stone-300 hover:text-rose-500 p-0.5"
                          title="Remover"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50 overflow-hidden">
                          <button
                            onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                            className="p-1 text-stone-600 hover:bg-stone-200 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-sans text-xs font-bold text-stone-900">
                            {quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                            disabled={quantity >= product.stock}
                            className="p-1 text-stone-600 hover:bg-stone-200 transition-colors disabled:opacity-30"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Info Form for WhatsApp Message */}
              <div className="space-y-4 pt-4 border-t border-stone-200">
                <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold block">
                  Dados para Atendimento no WhatsApp
                </span>

                {/* Customer Name */}
                <div>
                  <label className="block font-sans text-xs font-bold text-stone-700 mb-1">
                    Seu Nome Completo (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Maria Silva"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl font-sans text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                {/* Delivery Option */}
                <div>
                  <label className="block font-sans text-xs font-bold text-stone-700 mb-1.5">
                    Como deseja receber seus livros?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('pickup')}
                      className={`p-2.5 rounded-xl border text-center font-sans text-xs flex flex-col items-center gap-1 transition-all ${
                        deliveryMethod === 'pickup'
                          ? 'border-stone-900 bg-stone-900 text-white font-bold'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <Building className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Retirada</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('delivery')}
                      className={`p-2.5 rounded-xl border text-center font-sans text-xs flex flex-col items-center gap-1 transition-all ${
                        deliveryMethod === 'delivery'
                          ? 'border-stone-900 bg-stone-900 text-white font-bold'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Motoboy</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('shipping')}
                      className={`p-2.5 rounded-xl border text-center font-sans text-xs flex flex-col items-center gap-1 transition-all ${
                        deliveryMethod === 'shipping'
                          ? 'border-stone-900 bg-stone-900 text-white font-bold'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Correios</span>
                    </button>
                  </div>
                </div>

                {/* Payment Preference */}
                <div>
                  <label className="block font-sans text-xs font-bold text-stone-700 mb-1.5">
                    Pretensão de Pagamento
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentPreference('pix')}
                      className={`p-2 rounded-xl border font-sans text-xs flex items-center justify-center gap-1.5 transition-all ${
                        paymentPreference === 'pix'
                          ? 'border-stone-900 bg-stone-900 text-white font-bold'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>PIX</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentPreference('card')}
                      className={`p-2 rounded-xl border font-sans text-xs flex items-center justify-center gap-1.5 transition-all ${
                        paymentPreference === 'card'
                          ? 'border-stone-900 bg-stone-900 text-white font-bold'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Cartão</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentPreference('cash')}
                      className={`p-2 rounded-xl border font-sans text-xs flex items-center justify-center gap-1.5 transition-all ${
                        paymentPreference === 'cash'
                          ? 'border-stone-900 bg-stone-900 text-white font-bold'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <span>Dinheiro</span>
                    </button>
                  </div>
                </div>

                {/* Optional Note */}
                <div>
                  <label className="block font-sans text-xs font-bold text-stone-700 mb-1">
                    Observação ou Endereço (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Por favor incluir embalagem para presente..."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl font-sans text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 resize-none"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer with WhatsApp Action Button */}
        {items.length > 0 && (
          <div className="p-5 bg-white border-t border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs font-bold text-stone-500 uppercase tracking-wider">
                Subtotal Estimado
              </span>
              <span className="font-serif text-2xl font-bold text-stone-900">
                R$ {subtotal.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <p className="font-sans text-[11px] text-stone-400 leading-tight">
              Os itens e dados acima serão formatados automaticamente para você enviar ao WhatsApp da livraria.
            </p>

            <button
              id="send-whatsapp-order-btn"
              onClick={handleSendToWhatsApp}
              className="w-full py-3.5 px-6 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full font-sans font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-98"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>Enviar Pedido para WhatsApp</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
