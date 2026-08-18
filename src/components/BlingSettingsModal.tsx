import React, { useState, useEffect } from 'react';
import { 
  X, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  Database, 
  Store, 
  MessageCircle, 
  Sliders, 
  Layers, 
  ArrowUpDown,
  Zap,
  HelpCircle,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { BlingConfig, StoreSettings, Product } from '../types';
import { 
  testBlingConnectionApi, 
  triggerBlingSync, 
  updateStoreConfig, 
  updateStockSimulation,
  fetchBlingAuthUrl 
} from '../services/api';

interface BlingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  blingConfig: BlingConfig;
  storeSettings: StoreSettings;
  products: Product[];
  onConfigUpdated: (store: StoreSettings, bling: BlingConfig) => void;
  onProductsUpdated: () => void;
}

export function BlingSettingsModal({
  isOpen,
  onClose,
  blingConfig,
  storeSettings,
  products,
  onConfigUpdated,
  onProductsUpdated,
}: BlingSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'bling' | 'store' | 'stock-simulator'>('bling');

  // Form states
  const [tokenInput, setTokenInput] = useState<string>('');
  const [showToken, setShowToken] = useState<boolean>(false);
  const [apiVersion, setApiVersion] = useState<'v3' | 'v2'>(blingConfig.apiVersion || 'v3');
  const [depositName, setDepositName] = useState<string>(blingConfig.depositName || 'Depósito Geral');
  const [autoSync, setAutoSync] = useState<boolean>(blingConfig.autoSync);
  const [syncInterval, setSyncInterval] = useState<number>(blingConfig.syncIntervalMinutes || 10);
  const [copiedRedirect, setCopiedRedirect] = useState<boolean>(false);
  const [redirectUri, setRedirectUri] = useState<string>('');

  // Store form
  const [storeForm, setStoreForm] = useState<StoreSettings>({ ...storeSettings });

  // Test connection & Sync states
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  // Stock simulator state
  const [selectedSimSku, setSelectedSimSku] = useState<string>(products[0]?.sku || '');
  const [simStockValue, setSimStockValue] = useState<number>(products[0]?.stock || 10);
  const [simMsg, setSimMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const origin = window.location.origin;
      setRedirectUri(`${origin}/api/bling/callback`);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testBlingConnectionApi(tokenInput.trim() || undefined);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Erro ao conectar ao Bling' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleConnectBlingOAuth = async () => {
    try {
      const authData = await fetchBlingAuthUrl();
      if (authData.url) {
        const popup = window.open(
          authData.url, 
          'BlingOAuthWindow', 
          'width=600,height=750,scrollbars=yes,status=yes'
        );
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          // If popup blocked, navigate directly
          window.location.href = authData.url;
        }
      }
    } catch (err: any) {
      alert('Erro ao iniciar autorização do Bling: ' + err.message);
    }
  };

  const handleCopyRedirectUri = () => {
    const uri = redirectUri || `${window.location.origin}/api/bling/callback`;
    navigator.clipboard.writeText(uri);
    setCopiedRedirect(true);
    setTimeout(() => setCopiedRedirect(false), 2500);
  };

  const handleSaveBlingConfig = async () => {
    try {
      const payload = {
        bling: {
          accessToken: tokenInput.trim() || undefined,
          apiKey: apiVersion === 'v2' ? tokenInput.trim() : undefined,
          apiVersion,
          depositName,
          autoSync,
          syncIntervalMinutes: syncInterval,
        },
      };
      const res = await updateStoreConfig(payload);
      onConfigUpdated(res.store, res.bling);
      setTestResult({ success: true, message: 'Configurações do Bling salvas com sucesso!' });
    } catch (err: any) {
      setTestResult({ success: false, message: 'Erro ao salvar configurações.' });
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await triggerBlingSync();
      setSyncResult(res);
      onProductsUpdated();
    } catch (err: any) {
      setSyncResult({ success: false, message: 'Falha ao sincronizar produtos do Bling.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveStoreSettings = async () => {
    try {
      const res = await updateStoreConfig({ store: storeForm });
      onConfigUpdated(res.store, res.bling);
      alert('Dados da Livraria Manancial atualizados com sucesso!');
    } catch (err) {
      alert('Erro ao salvar dados da loja.');
    }
  };

  const handleApplySimulatedStock = async () => {
    if (!selectedSimSku) return;
    try {
      const res = await updateStockSimulation(selectedSimSku, Number(simStockValue));
      setSimMsg(res.message);
      onProductsUpdated();
      setTimeout(() => setSimMsg(null), 3000);
    } catch (err) {
      setSimMsg('Erro ao atualizar estoque');
    }
  };

  const currentRedirect = redirectUri || `${window.location.origin}/api/bling/callback`;

  return (
    <div 
      id="bling-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        id="bling-modal-panel"
        className="relative w-full max-w-2xl bg-[#FDFCFB] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-stone-200 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-800 text-stone-200 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-white leading-none">
                Integração Bling ERP & Dados da Livraria
              </h2>
              <p className="font-sans text-[11px] uppercase tracking-wider text-stone-400 mt-1">
                Controle de estoque em tempo real e encaminhamento de pedidos
              </p>
            </div>
          </div>

          <button
            id="close-bling-modal-button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-stone-200 bg-stone-50 px-4">
          <button
            id="tab-bling-config"
            onClick={() => setActiveTab('bling')}
            className={`flex items-center gap-2 py-3 px-4 font-sans text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'bling'
                ? 'border-stone-900 text-stone-950 bg-[#FDFCFB]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Conexão Bling ERP (API v3)
          </button>

          <button
            id="tab-store-settings"
            onClick={() => setActiveTab('store')}
            className={`flex items-center gap-2 py-3 px-4 font-sans text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'store'
                ? 'border-stone-900 text-stone-950 bg-[#FDFCFB]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            WhatsApp & Loja
          </button>

          <button
            id="tab-stock-simulator"
            onClick={() => setActiveTab('stock-simulator')}
            className={`flex items-center gap-2 py-3 px-4 font-sans text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'stock-simulator'
                ? 'border-stone-900 text-stone-950 bg-[#FDFCFB]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            Testar Estoque em Tempo Real
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeTab === 'bling' && (
            <div className="space-y-5 text-xs">
              
              {/* OAuth 2.0 Live App Status */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-600 text-white rounded-lg">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-amber-950 text-sm">
                        Aplicativo Privado Bling ERP v3
                      </h3>
                      <p className="text-amber-800 text-[11px]">
                        Client ID e Secret vinculados ao catálogo da Livraria Manancial
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900">
                    OAuth 2.0 Ativo
                  </span>
                </div>

                {/* Credentials & Redirect Details */}
                <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                    <span className="font-semibold text-stone-600">Client ID:</span>
                    <span className="font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-800 break-all">
                      749c4de6de48ee068cca070d5c53fac640318d45
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                    <span className="font-semibold text-stone-600">Escopos Liberados:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-medium border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Produtos
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-medium border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Categorias
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-medium border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Controle de Estoque
                      </span>
                    </div>
                  </div>

                  {/* Redirect URI Box with Copy */}
                  <div className="pt-1 border-t border-stone-100">
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      URL de Redirecionamento (Callback URI cadastrada no Bling):
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        readOnly 
                        value={currentRedirect} 
                        className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-stone-700 select-all"
                      />
                      <button
                        type="button"
                        onClick={handleCopyRedirectUri}
                        className="flex items-center gap-1 px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-[11px] font-semibold transition-colors"
                      >
                        {copiedRedirect ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedRedirect ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Big OAuth Connect Action */}
                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleConnectBlingOAuth}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold shadow-xs text-xs transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Autorizar Acesso no Bling ERP (1-Clique)</span>
                  </button>

                  <button
                    id="bling-test-btn"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors"
                  >
                    {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />}
                    <span>Testar Conexão</span>
                  </button>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    testResult.success ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
                  }`}>
                    {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-700" />}
                    <div>
                      <p className="font-semibold">{testResult.message}</p>
                      {testResult.latencyMs !== undefined && (
                        <p className="text-[10px] opacity-75 mt-0.5">Tempo de resposta: {testResult.latencyMs}ms</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sync Actions */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">Sincronização em Tempo Real</h3>
                    <p className="text-[11px] text-stone-500">
                      Importe títulos, fotos, preços e quantidades físicas do seu estoque Bling.
                    </p>
                  </div>
                  <button
                    id="bling-sync-now-btn"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-600 bg-white p-2.5 rounded-xl border border-stone-200">
                  <span>Total de títulos ativos no catálogo: <strong>{products.length}</strong></span>
                  <span>Última sincronização: <strong>{blingConfig.lastSyncAt ? new Date(blingConfig.lastSyncAt).toLocaleTimeString('pt-BR') : 'Agora'}</strong></span>
                </div>

                {syncResult && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    syncResult.success ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{syncResult.message}</span>
                  </div>
                )}
              </div>

              {/* Manual Token / Fallback Config */}
              <details className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-stone-600">
                <summary className="font-semibold text-xs text-stone-800 cursor-pointer select-none">
                  Opções Avançadas: Inserção Manual de Access Token (Bearer v3)
                </summary>
                <div className="space-y-3 pt-3">
                  <div className="relative">
                    <input
                      id="bling-token-input"
                      type={showToken ? 'text' : 'password'}
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="Cole um Access Token Bearer v3 gerado manualmente se preferir..."
                      className="w-full pl-3 pr-10 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveBlingConfig}
                      className="px-3.5 py-1.5 bg-stone-800 text-white rounded-lg text-xs font-semibold"
                    >
                      Salvar Access Token
                    </button>
                  </div>
                </div>
              </details>
            </div>
          )}

          {activeTab === 'store' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="text-emerald-900 text-xs leading-relaxed">
                  Os pedidos montados pelos clientes no carrinho serão enviados diretamente para este WhatsApp oficial da <strong>Livraria Manancial</strong> com a listagem completa dos títulos e dados do cliente.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Nome da Livraria:</label>
                  <input
                    type="text"
                    value={storeForm.storeName}
                    onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Número de WhatsApp (com DDD):</label>
                    <input
                      id="store-whatsapp-input"
                      type="text"
                      value={storeForm.whatsappNumber}
                      onChange={(e) => setStoreForm({ ...storeForm, whatsappNumber: e.target.value })}
                      placeholder="Ex: 5511998765432"
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 font-mono"
                    />
                    <span className="text-[10px] text-stone-400">Formato: 55 + DDD + Número</span>
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Telefone de Exibição no Topo:</label>
                    <input
                      type="text"
                      value={storeForm.displayPhone}
                      onChange={(e) => setStoreForm({ ...storeForm, displayPhone: e.target.value })}
                      placeholder="Ex: (11) 99876-5432"
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Endereço da Loja Física:</label>
                    <input
                      type="text"
                      value={storeForm.address}
                      onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Horário de Funcionamento:</label>
                    <input
                      type="text"
                      value={storeForm.businessHours}
                      onChange={(e) => setStoreForm({ ...storeForm, businessHours: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">E-mail de Contato:</label>
                  <input
                    type="email"
                    value={storeForm.email}
                    onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900"
                  />
                </div>

                <button
                  id="save-store-settings-btn"
                  onClick={handleSaveStoreSettings}
                  className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs shadow-xs"
                >
                  Salvar Informações da Loja
                </button>
              </div>
            </div>
          )}

          {activeTab === 'stock-simulator' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-stone-100 rounded-2xl border border-stone-200 text-stone-700 leading-relaxed">
                <strong>Simulador de Movimentação de Estoque em Tempo Real:</strong> Escolha um produto e altere sua quantidade em estoque para testar como o catálogo reage instantaneamente aos badges de <em>Em Estoque</em>, <em>Últimas Unidades</em> ou <em>Esgotado</em>.
              </div>

              <div className="p-4 bg-white rounded-2xl border border-stone-200 space-y-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Selecione o Livro / Bíblia:</label>
                  <select
                    value={selectedSimSku}
                    onChange={(e) => {
                      const sku = e.target.value;
                      setSelectedSimSku(sku);
                      const prod = products.find(p => p.sku === sku);
                      if (prod) setSimStockValue(prod.stock);
                    }}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.sku}>
                        [{p.sku}] {p.name.slice(0, 45)}... (Estoque Atual: {p.stock} un.)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Nova Quantidade em Estoque:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={simStockValue}
                      onChange={(e) => setSimStockValue(parseInt(e.target.value) || 0)}
                      className="w-32 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono"
                    />
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSimStockValue(0)}
                        className="px-2.5 py-1.5 bg-red-100 text-red-700 rounded-lg text-[10px] font-bold"
                      >
                        0 (Esgotado)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimStockValue(2)}
                        className="px-2.5 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold"
                      >
                        2 (Últimas un.)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimStockValue(25)}
                        className="px-2.5 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold"
                      >
                        25 (Disponível)
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  id="apply-sim-stock-btn"
                  onClick={handleApplySimulatedStock}
                  className="w-full py-2.5 bg-stone-900 hover:bg-black text-white rounded-xl font-bold text-xs"
                >
                  Simular Atualização de Estoque
                </button>

                {simMsg && (
                  <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    {simMsg}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

