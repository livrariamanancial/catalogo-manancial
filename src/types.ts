export type CategoryId = 
  | 'todos'
  | 'biblias'
  | 'devocionais'
  | 'vida-crista'
  | 'teologia'
  | 'familia'
  | 'lideranca'
  | 'infantil'
  | 'estudo-academico'
  | 'papelaria';

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  iconName: string;
  subcategories?: string[];
}

export interface Product {
  id: string;
  sku: string; // Código Bling
  blingId?: string;
  name: string;
  author: string;
  publisher: string;
  category: CategoryId;
  subcategory?: string;
  price: number;
  promotionalPrice?: number;
  stock: number;
  minStockAlert?: number;
  isbn?: string;
  pages?: number;
  format?: 'Capa Dura' | 'Brochura' | 'Luxo' | 'Couro Sintético' | 'Zíper' | 'Espiral' | 'Outro';
  dimensions?: string;
  language?: string;
  description: string;
  synopsis: string;
  coverImage: string;
  tags: string[];
  isFeatured?: boolean;
  isBestseller?: boolean;
  releaseYear?: number;
  versionOrTranslation?: string; // e.g., 'NVI', 'ARC', 'NAA', 'King James Fiel 1611'
  updatedAt: string;
  lastStockSync?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderType = 'retirada' | 'entrega' | 'frete_a_combinar';
export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'a_combinar';

export interface CustomerOrderData {
  customerName: string;
  customerPhone?: string;
  orderType: OrderType;
  deliveryAddress?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface BlingConfig {
  apiKey?: string;
  accessToken?: string;
  clientId?: string;
  clientSecret?: string;
  hasClientId?: boolean;
  hasClientSecret?: boolean;
  hasAccessToken?: boolean;
  hasApiKey?: boolean;
  refreshToken?: string;
  tokenExpiresAt?: string;
  redirectUri?: string;
  apiVersion: 'v3' | 'v2';
  depositId?: string;
  depositName?: string;
  autoSync: boolean;
  syncIntervalMinutes: number;
  lastSyncAt?: string;
  status: 'connected' | 'disconnected' | 'error' | 'demo';
  errorMessage?: string;
  totalSyncedProducts: number;
}

export interface StoreSettings {
  storeName: string;
  whatsappNumber: string; // Ex: '5511999999999'
  displayPhone: string;  // Ex: '(11) 99999-9999'
  address: string;
  neighborhood: string;
  cityState: string;
  businessHours: string;
  instagram: string;
  email: string;
  welcomeMessage: string;
}

export interface FilterState {
  search: string;
  category: CategoryId;
  subcategory: string;
  inStockOnly: boolean;
  minPrice: number;
  maxPrice: number;
  publisher: string;
  format: string;
  version: string;
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'name_asc' | 'stock_desc' | 'newest';
}
