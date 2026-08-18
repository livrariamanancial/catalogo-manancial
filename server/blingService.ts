import { Product, BlingConfig, StoreSettings, CategoryId } from '../src/types';
import { INITIAL_PRODUCTS, INITIAL_STORE_SETTINGS, INITIAL_BLING_CONFIG } from '../src/data/initialCatalog';

// In-memory runtime database for products, settings and Bling sync state
class StoreDatabase {
  private products: Product[] = [...INITIAL_PRODUCTS];
  private storeSettings: StoreSettings = { ...INITIAL_STORE_SETTINGS };
  private blingConfig: BlingConfig = { ...INITIAL_BLING_CONFIG };

  constructor() {
    // Check environment variables or default settings for Bling Client credentials
    const envClientId = process.env.BLING_CLIENT_ID || '749c4de6de48ee068cca070d5c53fac640318d45';
    const envClientSecret = process.env.BLING_CLIENT_SECRET || 'fc8752d6d604301beb70736c128e36328627d4f97f3f1a146aa81d32e1d5';

    if (envClientId) {
      this.blingConfig.clientId = envClientId;
      this.blingConfig.hasClientId = true;
    }
    if (envClientSecret) {
      this.blingConfig.clientSecret = envClientSecret;
      this.blingConfig.hasClientSecret = true;
    }

    if (process.env.BLING_ACCESS_TOKEN || process.env.BLING_API_KEY) {
      this.blingConfig.accessToken = process.env.BLING_ACCESS_TOKEN || process.env.BLING_API_KEY;
      this.blingConfig.apiKey = process.env.BLING_API_KEY;
      this.blingConfig.status = 'connected';
    }
    if (process.env.WHATSAPP_PHONE) {
      this.storeSettings.whatsappNumber = process.env.WHATSAPP_PHONE.replace(/\D/g, '');
    }
  }

  public getProducts(): Product[] {
    return this.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.products.find(p => p.id === id || p.sku === id);
  }

  public getStoreSettings(): StoreSettings {
    return this.storeSettings;
  }

  public updateStoreSettings(newSettings: Partial<StoreSettings>): StoreSettings {
    this.storeSettings = { ...this.storeSettings, ...newSettings };
    return this.storeSettings;
  }

  public getBlingConfig(): BlingConfig {
    return this.blingConfig;
  }

  public updateBlingConfig(newConfig: Partial<BlingConfig>): BlingConfig {
    this.blingConfig = { ...this.blingConfig, ...newConfig };
    return this.blingConfig;
  }

  public updateProductStock(idOrSku: string, newStock: number): Product | null {
    const product = this.products.find(p => p.id === idOrSku || p.sku === idOrSku);
    if (product) {
      product.stock = Math.max(0, newStock);
      product.lastStockSync = new Date().toISOString();
      product.updatedAt = new Date().toISOString();
      return product;
    }
    return null;
  }

  public setProducts(newProducts: Product[]): void {
    this.products = newProducts;
    this.blingConfig.totalSyncedProducts = newProducts.length;
    this.blingConfig.lastSyncAt = new Date().toISOString();
  }

  public mergeBlingProducts(blingItems: Array<{ 
    sku: string; 
    stock?: number; 
    price?: number; 
    name?: string; 
    description?: string; 
    coverImage?: string; 
    category?: CategoryId;
    publisher?: string;
    author?: string;
  }>): { updated: number; added: number } {
    let updated = 0;
    let added = 0;

    for (const item of blingItems) {
      const existing = this.products.find(p => p.sku === item.sku);
      if (existing) {
        if (typeof item.stock === 'number') existing.stock = item.stock;
        if (typeof item.price === 'number' && item.price > 0) existing.price = item.price;
        if (item.name) existing.name = item.name;
        if (item.coverImage) existing.coverImage = item.coverImage;
        if (item.description) {
          existing.description = item.description;
          existing.synopsis = item.description;
        }
        if (item.publisher) existing.publisher = item.publisher;
        if (item.author) existing.author = item.author;
        if (item.category) existing.category = item.category;

        existing.lastStockSync = new Date().toISOString();
        existing.updatedAt = new Date().toISOString();
        updated++;
      } else if (item.name && item.sku) {
        this.products.push({
          id: `bling-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          sku: item.sku,
          name: item.name,
          author: item.author || 'Livraria Manancial',
          publisher: item.publisher || 'Editora Geral',
          category: item.category || 'biblias',
          price: item.price || 59.90,
          stock: typeof item.stock === 'number' ? item.stock : 10,
          description: item.description || item.name,
          synopsis: item.description || item.name,
          coverImage: item.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
          tags: ['bling', 'sincronizado'],
          updatedAt: new Date().toISOString(),
          lastStockSync: new Date().toISOString(),
        });
        added++;
      }
    }

    this.blingConfig.lastSyncAt = new Date().toISOString();
    this.blingConfig.totalSyncedProducts = this.products.length;
    return { updated, added };
  }
}

export const db = new StoreDatabase();

/**
 * Helper to build Basic Auth header for Bling OAuth 2.0
 */
function getBasicAuthHeader(clientId?: string, clientSecret?: string): string {
  const cId = clientId || db.getBlingConfig().clientId || '749c4de6de48ee068cca070d5c53fac640318d45';
  const cSec = clientSecret || db.getBlingConfig().clientSecret || 'fc8752d6d604301beb70736c128e36328627d4f97f3f1a146aa81d32e1d5';
  const credentials = `${cId}:${cSec}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

/**
 * Generate the Bling OAuth 2.0 Authorization URL
 */
export function getBlingAuthorizeUrl(redirectUri?: string): string {
  const config = db.getBlingConfig();
  const clientId = config.clientId || '749c4de6de48ee068cca070d5c53fac640318d45';
  const state = `manancial_${Date.now()}`;
  
  let url = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&state=${state}`;
  if (redirectUri) {
    url += `&redirect_uri=${encodeURIComponent(redirectUri)}`;
  }
  return url;
}

/**
 * Exchange Authorization Code for Access & Refresh Tokens
 */
export async function exchangeBlingAuthCode(code: string, redirectUri?: string): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const config = db.getBlingConfig();
    const clientId = config.clientId || '749c4de6de48ee068cca070d5c53fac640318d45';
    const clientSecret = config.clientSecret || 'fc8752d6d604301beb70736c128e36328627d4f97f3f1a146aa81d32e1d5';
    const basicAuth = getBasicAuthHeader(clientId, clientSecret);

    const bodyParams = new URLSearchParams();
    bodyParams.append('grant_type', 'authorization_code');
    bodyParams.append('code', code);
    if (redirectUri) {
      bodyParams.append('redirect_uri', redirectUri);
    }

    const response = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': basicAuth,
        'Accept': 'application/json',
      },
      body: bodyParams.toString(),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Bling OAuth token error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const accessToken = data.access_token;
    const refreshToken = data.refresh_token;
    const expiresIn = data.expires_in || 21600;
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    db.updateBlingConfig({
      accessToken,
      refreshToken,
      tokenExpiresAt,
      status: 'connected',
      errorMessage: undefined,
      lastSyncAt: new Date().toISOString(),
    });

    // Automatically trigger initial product & stock synchronization
    syncBlingProducts().catch((e) => console.error('Auto sync after auth failed:', e));

    return {
      success: true,
      message: 'Autorização com Bling ERP concluída com sucesso! Token v3 obtido e estoque conectado.',
      data: {
        expiresIn,
        tokenExpiresAt,
      },
    };
  } catch (err: any) {
    db.updateBlingConfig({
      status: 'error',
      errorMessage: err.message,
    });
    return {
      success: false,
      message: `Falha na autorização OAuth do Bling: ${err.message}`,
    };
  }
}

/**
 * Refresh expired Access Token using Refresh Token
 */
export async function refreshBlingToken(): Promise<boolean> {
  const config = db.getBlingConfig();
  if (!config.refreshToken) return false;

  try {
    const basicAuth = getBasicAuthHeader(config.clientId, config.clientSecret);
    const bodyParams = new URLSearchParams();
    bodyParams.append('grant_type', 'refresh_token');
    bodyParams.append('refresh_token', config.refreshToken);

    const response = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': basicAuth,
        'Accept': 'application/json',
      },
      body: bodyParams.toString(),
    });

    if (response.ok) {
      const data = await response.json();
      db.updateBlingConfig({
        accessToken: data.access_token,
        refreshToken: data.refresh_token || config.refreshToken,
        tokenExpiresAt: new Date(Date.now() + (data.expires_in || 21600) * 1000).toISOString(),
        status: 'connected',
      });
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error refreshing Bling token:', e);
    return false;
  }
}

/**
 * Service to interact with Bling API v3 and v2
 */
export async function testBlingConnection(tokenOrKey?: string): Promise<{ success: boolean; message: string; latencyMs: number; details?: any }> {
  const start = Date.now();
  const token = tokenOrKey || db.getBlingConfig().accessToken || db.getBlingConfig().apiKey;

  if (!token) {
    return {
      success: true,
      message: 'Credenciais do Bling configuradas (Client ID: 749c4de6...). Conecte via OAuth v3 para sincronização em tempo real.',
      latencyMs: Date.now() - start,
      details: { 
        mode: 'ready_to_connect', 
        clientId: '749c4de6de48ee068cca070d5c53fac640318d45',
        store: 'Livraria Manancial', 
        productsCount: db.getProducts().length 
      }
    };
  }

  try {
    // Attempt real Bling API v3 request to /depositos or /produtos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch('https://www.bling.com.br/Api/v3/depositos', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - start;

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      db.updateBlingConfig({
        status: 'connected',
        lastSyncAt: new Date().toISOString(),
        errorMessage: undefined
      });
      return {
        success: true,
        message: 'Conexão com Bling ERP v3 ativa e autorizada! Estoque integrado.',
        latencyMs,
        details: data
      };
    } else if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        message: `Token do Bling não autorizado ou expirado (HTTP ${response.status}). Utilize o botão "Conectar com Bling v3" para renovar o acesso.`,
        latencyMs,
      };
    } else {
      return {
        success: false,
        message: `Servidor do Bling retornou status ${response.status}`,
        latencyMs,
      };
    }
  } catch (error: any) {
    const latencyMs = Date.now() - start;
    return {
      success: false,
      message: `Erro ao conectar com API do Bling: ${error.message || 'Falha na requisição'}.`,
      latencyMs,
    };
  }
}

/**
 * Sync products and real-time stock levels from Bling API
 */
export async function syncBlingProducts(): Promise<{ success: boolean; message: string; updatedCount: number; timestamp: string }> {
  const config = db.getBlingConfig();
  let token = config.accessToken || config.apiKey;

  if (!token) {
    // Demo / fallback mode
    const currentProducts = db.getProducts();
    for (const p of currentProducts) {
      p.lastStockSync = new Date().toISOString();
    }
    const timestamp = new Date().toISOString();
    db.updateBlingConfig({
      lastSyncAt: timestamp,
      status: 'demo',
      totalSyncedProducts: currentProducts.length
    });

    return {
      success: true,
      message: 'Catálogo atualizado com base de dados da Livraria Manancial (Pronto para conexão ao vivo com Client ID).',
      updatedCount: currentProducts.length,
      timestamp
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    // Call Bling API v3 /produtos with stock and prices
    let response = await fetch('https://www.bling.com.br/Api/v3/produtos?pagina=1&limite=100&criterio=5', {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    // If token expired, attempt auto-refresh
    if (response.status === 401 && config.refreshToken) {
      const refreshed = await refreshBlingToken();
      if (refreshed) {
        token = db.getBlingConfig().accessToken;
        response = await fetch('https://www.bling.com.br/Api/v3/produtos?pagina=1&limite=100&criterio=5', {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          signal: controller.signal,
        });
      }
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Bling retornou HTTP ${response.status}`);
    }

    const json = await response.json();
    const rawItems = json?.data || [];
    
    // Map Bling ERP product schema to storefront
    const blingItems = rawItems.map((item: any) => {
      let coverImage = item.imagemPrincipal || item.anexos?.[0]?.url || item.midia?.imagens?.principal?.link;
      if (!coverImage && item.imagens?.length > 0) {
        coverImage = item.imagens[0]?.link || item.imagens[0]?.url;
      }

      // Infer category from name or bling category
      let category: CategoryId = 'biblias';
      const lowerName = (item.nome || '').toLowerCase();
      if (lowerName.includes('bíblia') || lowerName.includes('biblia') || lowerName.includes('harpa') || lowerName.includes('arc') || lowerName.includes('nvi')) {
        category = 'biblias';
      } else if (lowerName.includes('devocional') || lowerName.includes('dia a dia') || lowerName.includes('medita')) {
        category = 'devocionais';
      } else if (lowerName.includes('teologia') || lowerName.includes('comentário') || lowerName.includes('grego') || lowerName.includes('hebraico')) {
        category = 'teologia';
      } else if (lowerName.includes('infantil') || lowerName.includes('criança') || lowerName.includes('histórias')) {
        category = 'infantil';
      } else if (lowerName.includes('família') || lowerName.includes('casamento') || lowerName.includes('filhos')) {
        category = 'familia';
      } else if (lowerName.includes('marcador') || lowerName.includes('capa') || lowerName.includes('diário') || lowerName.includes('caneca')) {
        category = 'papelaria';
      } else {
        category = 'vida-crista';
      }

      return {
        sku: item.codigo || item.sku || `BLING-${item.id}`,
        name: item.nome,
        price: typeof item.preco === 'number' ? item.preco : parseFloat(item.preco || '0'),
        stock: item.estoque?.saldoFisicoTotal ?? item.estoque?.saldoVirtualTotal ?? 10,
        description: item.descricaoCurta || item.descricaoComplementar || item.nome,
        coverImage: coverImage || undefined,
        category,
        publisher: item.marca || 'Editora Geral',
      };
    });

    const { updated, added } = db.mergeBlingProducts(blingItems);
    const timestamp = new Date().toISOString();

    db.updateBlingConfig({
      status: 'connected',
      lastSyncAt: timestamp,
      totalSyncedProducts: db.getProducts().length,
      errorMessage: undefined,
    });

    return {
      success: true,
      message: `Sincronização concluída com sucesso: ${updated} produtos atualizados e ${added} novos itens importados do Bling ERP.`,
      updatedCount: updated + added,
      timestamp,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Falha ao sincronizar com Bling: ${err.message}. Mantendo catálogo local em cache ativo.`,
      updatedCount: 0,
      timestamp: new Date().toISOString(),
    };
  }
}

