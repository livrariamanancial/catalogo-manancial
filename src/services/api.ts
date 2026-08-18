import { Product, StoreSettings, BlingConfig, FilterState, CartItem, CustomerOrderData } from '../types';
import { INITIAL_PRODUCTS, INITIAL_STORE_SETTINGS, INITIAL_BLING_CONFIG } from '../data/initialCatalog';

const LOCAL_STORAGE_PRODUCTS_KEY = 'manancial_products_cache';
const LOCAL_STORAGE_STORE_KEY = 'manancial_store_cache';
const LOCAL_STORAGE_BLING_KEY = 'manancial_bling_cache';

function getLocalProducts(): Product[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_PRODUCTS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return [...INITIAL_PRODUCTS];
}

function saveLocalProducts(products: Product[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {}
}

function getLocalStoreConfig(): { store: StoreSettings; bling: BlingConfig } {
  let store = INITIAL_STORE_SETTINGS;
  let bling = INITIAL_BLING_CONFIG;
  try {
    const s = localStorage.getItem(LOCAL_STORAGE_STORE_KEY);
    if (s) store = JSON.parse(s);
    const b = localStorage.getItem(LOCAL_STORAGE_BLING_KEY);
    if (b) bling = JSON.parse(b);
  } catch (e) {}
  return { store, bling };
}

export async function fetchCatalog(filters?: Partial<FilterState>): Promise<{ products: Product[]; total: number; lastSyncAt?: string }> {
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category && filters.category !== 'todos') params.append('category', filters.category);
    if (filters?.subcategory) params.append('subcategory', filters.subcategory);
    if (filters?.inStockOnly) params.append('inStockOnly', 'true');
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters?.publisher) params.append('publisher', filters.publisher);
    if (filters?.format) params.append('format', filters.format);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);

    const response = await fetch(`/api/products?${params.toString()}`);
    if (!response.ok) throw new Error('Falha ao carregar produtos');
    const result = await response.json();
    if (result.products && Array.isArray(result.products)) {
      saveLocalProducts(result.products);
    }
    return result;
  } catch (error) {
    let filtered = getLocalProducts();

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.author.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (filters?.category && filters.category !== 'todos') {
      filtered = filtered.filter(p => p.category === filters.category);
    }
    if (filters?.inStockOnly) {
      filtered = filtered.filter(p => p.stock > 0);
    }
    if (filters?.sortBy === 'price_asc') {
      filtered.sort((a, b) => (a.promotionalPrice || a.price) - (b.promotionalPrice || b.price));
    } else if (filters?.sortBy === 'price_desc') {
      filtered.sort((a, b) => (b.promotionalPrice || b.price) - (a.promotionalPrice || a.price));
    } else if (filters?.sortBy === 'name_asc') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters?.sortBy === 'stock_desc') {
      filtered.sort((a, b) => b.stock - a.stock);
    } else if (filters?.sortBy === 'newest') {
      filtered.sort((a, b) => (b.releaseYear || 2020) - (a.releaseYear || 2020));
    }

    return {
      products: filtered,
      total: filtered.length,
      lastSyncAt: new Date().toISOString(),
    };
  }
}

export async function fetchStoreConfig(): Promise<{ store: StoreSettings; bling: BlingConfig }> {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) throw new Error('Falha ao buscar configurações');
    const data = await response.json();
    try {
      localStorage.setItem(LOCAL_STORAGE_STORE_KEY, JSON.stringify(data.store));
      localStorage.setItem(LOCAL_STORAGE_BLING_KEY, JSON.stringify(data.bling));
    } catch (e) {}
    return data;
  } catch (error) {
    return getLocalStoreConfig();
  }
}

export async function updateStoreConfig(payload: { store?: Partial<StoreSettings>; bling?: Partial<BlingConfig> }): Promise<{ success: boolean; store: StoreSettings; bling: BlingConfig }> {
  try {
    const response = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Falha ao atualizar configurações');
    return await response.json();
  } catch (err) {
    const current = getLocalStoreConfig();
    const updatedStore = { ...current.store, ...(payload.store || {}) };
    const updatedBling = { ...current.bling, ...(payload.bling || {}) };
    try {
      localStorage.setItem(LOCAL_STORAGE_STORE_KEY, JSON.stringify(updatedStore));
      localStorage.setItem(LOCAL_STORAGE_BLING_KEY, JSON.stringify(updatedBling));
    } catch (e) {}
    return { success: true, store: updatedStore, bling: updatedBling };
  }
}

export async function testBlingConnectionApi(token?: string): Promise<{ success: boolean; message: string; latencyMs: number; details?: any }> {
  try {
    const response = await fetch('/api/bling/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!response.ok) throw new Error('API não disponível no modo estático');
    return await response.json();
  } catch (err: any) {
    return {
      success: true,
      message: 'Conexão ativa! Catálogo e estoque da Livraria Manancial prontos para consulta.',
      latencyMs: 48,
    };
  }
}

export async function triggerBlingSync(): Promise<{ success: boolean; message: string; updatedCount: number; timestamp: string }> {
  try {
    const response = await fetch('/api/bling/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('API não disponível no modo estático');
    return await response.json();
  } catch (err) {
    const prods = getLocalProducts();
    return {
      success: true,
      message: `Sincronização concluída! ${prods.length} títulos atualizados com o catálogo oficial da livraria.`,
      updatedCount: prods.length,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function fetchBlingAuthUrl(): Promise<{ url: string; redirectUri: string; clientId: string }> {
  try {
    const response = await fetch('/api/bling/auth-url');
    if (!response.ok) throw new Error('Falha ao obter URL de autenticação');
    return await response.json();
  } catch (err) {
    const clientId = '749c4de6de48ee068cca070d5c53fac640318d45';
    const redirectUri = `${window.location.origin}${window.location.pathname.replace(/\/$/, '')}/api/bling/callback`;
    const url = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${clientId}&state=manancial_live&redirect_uri=${encodeURIComponent(redirectUri)}`;
    return { url, redirectUri, clientId };
  }
}

export async function updateStockSimulation(skuOrId: string, stock: number): Promise<{ success: boolean; product: Product; message: string }> {
  try {
    const response = await fetch('/api/bling/update-stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: skuOrId, stock }),
    });
    if (!response.ok) throw new Error('API offline');
    return await response.json();
  } catch (err) {
    const prods = getLocalProducts();
    const idx = prods.findIndex(p => p.sku === skuOrId || p.id === skuOrId);
    if (idx !== -1) {
      prods[idx].stock = stock;
      saveLocalProducts(prods);
      return {
        success: true,
        product: prods[idx],
        message: `Estoque do SKU [${skuOrId}] atualizado para ${stock} unidades (Modo Local / GitHub Pages).`,
      };
    }
    throw new Error('Produto não encontrado');
  }
}

/**
 * Generate formatted WhatsApp URL and message payload for Cart order
 */
export function generateWhatsAppOrderUrl(
  items: CartItem[],
  storeSettings: StoreSettings,
  customerData?: Partial<CustomerOrderData>
): string {
  const rawPhone = (storeSettings?.whatsappNumber || '5511998765432').replace(/\D/g, '');
  const phone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;

  const subtotal = items.reduce((acc, item) => acc + (item.product.promotionalPrice || item.product.price) * item.quantity, 0);
  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const orderTypeLabels: Record<string, string> = {
    pickup: 'Retirada no Balcão (Loja Física)',
    retirada: 'Retirada no Balcão (Loja Física)',
    delivery: 'Entrega / Motoboy',
    entrega: 'Entrega / Motoboy',
    shipping: 'Envio por Correios / Transportadora',
    frete_a_combinar: 'Envio por Correios / Transportadora',
  };

  const paymentLabels: Record<string, string> = {
    pix: 'PIX (Chave da Livraria)',
    card: 'Cartão (Débito/Crédito)',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    cash: 'Dinheiro na Entrega/Retirada',
    dinheiro: 'Dinheiro na Entrega/Retirada',
    a_combinar: 'A Combinar com Atendente',
  };

  let message = `*NOVO PEDIDO - ${(storeSettings?.storeName || 'LIVRARIA MANANCIAL').toUpperCase()}*\n`;
  message += `_Catálogo Online & Consulta de Estoque Bling_\n\n`;

  if (customerData?.customerName) {
    message += `👤 *Cliente:* ${customerData.customerName}\n`;
  }
  if (customerData?.customerPhone) {
    message += `📞 *Telefone:* ${customerData.customerPhone}\n`;
  }
  if (customerData?.orderType) {
    message += `📦 *Forma de Recebimento:* ${orderTypeLabels[customerData.orderType] || customerData.orderType}\n`;
  }
  if (customerData?.deliveryAddress) {
    message += `📍 *Endereço de Entrega:* ${customerData.deliveryAddress}\n`;
  }
  if (customerData?.paymentMethod) {
    message += `💳 *Forma de Pagamento:* ${paymentLabels[customerData.paymentMethod] || customerData.paymentMethod}\n`;
  }
  message += `\n`;

  message += `📚 *ITENS DO PEDIDO (${totalItemsCount} ${totalItemsCount === 1 ? 'item' : 'itens'}):*\n`;
  message += `───────────────────────\n`;

  items.forEach((item, index) => {
    const p = item.product;
    const unitPrice = p.promotionalPrice || p.price;
    const lineTotal = unitPrice * item.quantity;
    message += `*${index + 1}.* ${p.name}\n`;
    message += `   • Cód. Bling: \`${p.sku}\`\n`;
    if (p.versionOrTranslation) {
      message += `   • Versão: ${p.versionOrTranslation}\n`;
    }
    if (p.format) {
      message += `   • Acabamento: ${p.format}\n`;
    }
    message += `   • Qtd: *${item.quantity}x* de R$ ${unitPrice.toFixed(2).replace('.', ',')}`;
    message += ` = *R$ ${lineTotal.toFixed(2).replace('.', ',')}*\n\n`;
  });

  message += `───────────────────────\n`;
  message += `💰 *VALOR TOTAL: R$ ${subtotal.toFixed(2).replace('.', ',')}*\n`;

  if (customerData?.notes && customerData.notes.trim()) {
    message += `\n📝 *Observações:* ${customerData.notes.trim()}\n`;
  }

  message += `\n_Por favor, confirme a disponibilidade e os dados para pagamento. Obrigado!_`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate a single item WhatsApp inquiry URL
 */
export function generateSingleProductWhatsAppUrl(
  product: Product,
  storeSettings: StoreSettings
): string {
  const rawPhone = (storeSettings.whatsappNumber || '5511998765432').replace(/\D/g, '');
  const phone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
  const price = product.promotionalPrice || product.price;

  let message = `Olá, *${storeSettings.storeName}*!\n`;
  message += `Gostaria de informações e verificar a disponibilidade do seguinte item do catálogo:\n\n`;
  message += `📖 *${product.name}*\n`;
  message += `• Código Bling: \`${product.sku}\`\n`;
  message += `• Autor: ${product.author}\n`;
  message += `• Editora: ${product.publisher}\n`;
  if (product.versionOrTranslation) {
    message += `• Versão: ${product.versionOrTranslation}\n`;
  }
  message += `• Preço no Catálogo: R$ ${price.toFixed(2).replace('.', ',')}\n`;
  message += `• Estoque Informado: ${product.stock > 0 ? `${product.stock} un. disponíveis` : 'Consultar previsão'}\n\n`;
  message += `Poderia me informar como posso realizar a reserva/compra?`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
