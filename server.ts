import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { 
  db, 
  testBlingConnection, 
  syncBlingProducts, 
  getBlingAuthorizeUrl, 
  exchangeBlingAuthCode 
} from "./server/blingService";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Get Store Configuration and sanitized Bling status
  app.get("/api/config", (req, res) => {
    const store = db.getStoreSettings();
    const bling = db.getBlingConfig();
    
    // Derive dynamic redirect URI based on current request host
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const redirectUri = `${protocol}://${host}/api/bling/callback`;

    res.json({
      store,
      bling: {
        ...bling,
        clientId: bling.clientId ? `${bling.clientId.slice(0, 6)}...${bling.clientId.slice(-4)}` : undefined,
        accessToken: bling.accessToken ? `${bling.accessToken.slice(0, 4)}...${bling.accessToken.slice(-4)}` : undefined,
        apiKey: bling.apiKey ? `${bling.apiKey.slice(0, 4)}...${bling.apiKey.slice(-4)}` : undefined,
        hasClientId: !!bling.clientId,
        hasClientSecret: !!bling.clientSecret,
        hasAccessToken: !!bling.accessToken,
        hasApiKey: !!bling.apiKey,
        redirectUri,
      },
    });
  });

  // Update Store Settings and Bling Config
  app.post("/api/config", (req, res) => {
    const { store, bling } = req.body || {};
    if (store) {
      db.updateStoreSettings(store);
    }
    if (bling) {
      const current = db.getBlingConfig();
      const updatedBling = { ...current };

      if (bling.clientId && !bling.clientId.includes('...')) {
        updatedBling.clientId = bling.clientId;
        updatedBling.hasClientId = true;
      }
      if (bling.clientSecret && !bling.clientSecret.includes('...')) {
        updatedBling.clientSecret = bling.clientSecret;
        updatedBling.hasClientSecret = true;
      }
      if (bling.accessToken && !bling.accessToken.includes('...')) {
        updatedBling.accessToken = bling.accessToken;
      }
      if (bling.apiKey && !bling.apiKey.includes('...')) {
        updatedBling.apiKey = bling.apiKey;
      }
      if (typeof bling.autoSync === 'boolean') {
        updatedBling.autoSync = bling.autoSync;
      }
      if (typeof bling.syncIntervalMinutes === 'number') {
        updatedBling.syncIntervalMinutes = bling.syncIntervalMinutes;
      }
      if (bling.depositName) {
        updatedBling.depositName = bling.depositName;
      }
      if (bling.apiVersion) {
        updatedBling.apiVersion = bling.apiVersion;
      }

      db.updateBlingConfig(updatedBling);
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const redirectUri = `${protocol}://${host}/api/bling/callback`;

    res.json({
      success: true,
      store: db.getStoreSettings(),
      bling: {
        ...db.getBlingConfig(),
        clientId: db.getBlingConfig().clientId ? `${db.getBlingConfig().clientId?.slice(0, 6)}...` : undefined,
        accessToken: db.getBlingConfig().accessToken ? 'configured' : undefined,
        apiKey: db.getBlingConfig().apiKey ? 'configured' : undefined,
        hasClientId: !!db.getBlingConfig().clientId,
        hasClientSecret: !!db.getBlingConfig().clientSecret,
        redirectUri,
      },
    });
  });

  // Bling OAuth 2.0 Auth URL generator
  app.get("/api/bling/auth-url", (req, res) => {
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const redirectUri = `${protocol}://${host}/api/bling/callback`;
    const authUrl = getBlingAuthorizeUrl(redirectUri);

    res.json({
      url: authUrl,
      redirectUri,
      clientId: db.getBlingConfig().clientId || '749c4de6de48ee068cca070d5c53fac640318d45',
    });
  });

  // Bling OAuth Callback Endpoint
  app.get("/api/bling/callback", async (req, res) => {
    const code = req.query.code as string;
    const error = req.query.error as string;

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const redirectUri = `${protocol}://${host}/api/bling/callback`;

    if (error) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>Erro de Autenticação - Bling ERP</title>
          <style>
            body { font-family: sans-serif; background: #FAF9F6; color: #1C1917; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: white; padding: 2.5rem; border-radius: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); max-width: 420px; text-align: center; border: 1px solid #E7E5E4; }
            h1 { color: #DC2626; font-size: 1.25rem; margin-bottom: 0.5rem; }
            p { font-size: 0.875rem; color: #78716C; margin-bottom: 1.5rem; line-height: 1.5; }
            a { display: inline-block; background: #1C1917; color: white; padding: 0.75rem 1.5rem; border-radius: 9999px; text-decoration: none; font-size: 0.875rem; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Falha na Autorização</h1>
            <p>O Bling retornou o seguinte erro: <strong>${error}</strong></p>
            <a href="/">Voltar ao Catálogo</a>
          </div>
        </body>
        </html>
      `);
    }

    if (!code) {
      return res.redirect('/');
    }

    const exchangeResult = await exchangeBlingAuthCode(code, redirectUri);

    res.send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Conexão Bling Concluída - Livraria Manancial</title>
        <style>
          body { font-family: sans-serif; background: #FAF9F6; color: #1C1917; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: white; padding: 2.5rem; border-radius: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); max-width: 440px; text-align: center; border: 1px solid #E7E5E4; }
          .icon { width: 56px; height: 56px; background: #DCFCE7; color: #16A34A; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; font-size: 1.75rem; }
          h1 { color: #1C1917; font-size: 1.35rem; margin-bottom: 0.5rem; }
          p { font-size: 0.875rem; color: #57534E; margin-bottom: 1.5rem; line-height: 1.5; }
          .btn { display: inline-block; background: #1C1917; color: white; padding: 0.75rem 1.75rem; border-radius: 9999px; text-decoration: none; font-size: 0.875rem; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✓</div>
          <h1>Bling ERP Conectado!</h1>
          <p>${exchangeResult.message}</p>
          <a class="btn" href="/">Abrir Catálogo</a>
        </div>
        <script>
          if (window.opener) {
            setTimeout(() => {
              window.opener.location.reload();
              window.close();
            }, 1200);
          } else {
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          }
        </script>
      </body>
      </html>
    `);
  });

  // Exchange Auth Code via API POST
  app.post("/api/bling/exchange-code", async (req, res) => {
    const { code, redirectUri } = req.body || {};
    if (!code) {
      return res.status(400).json({ success: false, message: "Código de autorização é obrigatório" });
    }
    const result = await exchangeBlingAuthCode(code, redirectUri);
    res.json(result);
  });

  // Get All Products with search, filtering and sorting
  app.get("/api/products", (req, res) => {
    const {
      search,
      category,
      subcategory,
      inStockOnly,
      minPrice,
      maxPrice,
      publisher,
      format,
      sortBy,
    } = req.query;

    let products = [...db.getProducts()];

    // Search query
    if (typeof search === 'string' && search.trim()) {
      const q = search.toLowerCase().trim();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.publisher.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.isbn && p.isbn.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q))) ||
        (p.versionOrTranslation && p.versionOrTranslation.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (typeof category === 'string' && category && category !== 'todos') {
      products = products.filter(p => p.category === category);
    }

    // Subcategory filter
    if (typeof subcategory === 'string' && subcategory) {
      products = products.filter(p => p.subcategory === subcategory);
    }

    // In Stock Only
    if (inStockOnly === 'true') {
      products = products.filter(p => p.stock > 0);
    }

    // Price range
    if (minPrice && !isNaN(Number(minPrice))) {
      products = products.filter(p => (p.promotionalPrice || p.price) >= Number(minPrice));
    }
    if (maxPrice && !isNaN(Number(maxPrice))) {
      products = products.filter(p => (p.promotionalPrice || p.price) <= Number(maxPrice));
    }

    // Publisher
    if (typeof publisher === 'string' && publisher) {
      products = products.filter(p => p.publisher.toLowerCase() === publisher.toLowerCase());
    }

    // Format
    if (typeof format === 'string' && format) {
      products = products.filter(p => p.format === format);
    }

    // Sorting
    if (sortBy === 'price_asc') {
      products.sort((a, b) => (a.promotionalPrice || a.price) - (b.promotionalPrice || b.price));
    } else if (sortBy === 'price_desc') {
      products.sort((a, b) => (b.promotionalPrice || b.price) - (a.promotionalPrice || a.price));
    } else if (sortBy === 'name_asc') {
      products.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    } else if (sortBy === 'stock_desc') {
      products.sort((a, b) => b.stock - a.stock);
    } else if (sortBy === 'newest') {
      products.sort((a, b) => (b.releaseYear || 2020) - (a.releaseYear || 2020));
    } else {
      // Relevance: Featured & Bestsellers first, then in stock
      products.sort((a, b) => {
        const scoreA = (a.isFeatured ? 4 : 0) + (a.isBestseller ? 2 : 0) + (a.stock > 0 ? 1 : -5);
        const scoreB = (b.isFeatured ? 4 : 0) + (b.isBestseller ? 2 : 0) + (b.stock > 0 ? 1 : -5);
        return scoreB - scoreA;
      });
    }

    res.json({
      total: products.length,
      products,
      lastSyncAt: db.getBlingConfig().lastSyncAt,
    });
  });

  // Get Single Product
  app.get("/api/products/:id", (req, res) => {
    const product = db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }
    res.json(product);
  });

  // Real-time Bling Stock Status & Test
  app.post("/api/bling/test-connection", async (req, res) => {
    const { token } = req.body || {};
    const result = await testBlingConnection(token);
    res.json(result);
  });

  // Sync with Bling ERP
  app.post("/api/bling/sync", async (req, res) => {
    const result = await syncBlingProducts();
    res.json(result);
  });

  // Update/Simulate Stock for a specific product
  app.post("/api/bling/update-stock", (req, res) => {
    const { id, sku, stock } = req.body || {};
    const target = id || sku;
    if (!target || typeof stock !== 'number') {
      return res.status(400).json({ error: "id/sku e valor numérico de estoque são obrigatórios" });
    }

    const updated = db.updateProductStock(target, stock);
    if (!updated) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    res.json({
      success: true,
      product: updated,
      message: `Estoque do item ${updated.sku} atualizado para ${updated.stock} un. em tempo real.`,
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Livraria Manancial server running on http://localhost:${PORT}`);
  });
}

startServer();
