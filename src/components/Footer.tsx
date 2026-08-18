import { Logo } from './Logo';
import { StoreSettings, CategoryId } from '../types';
import { MessageCircle, MapPin, Clock, Mail, ShieldCheck, Zap } from 'lucide-react';

interface FooterProps {
  storeSettings: StoreSettings;
  onSelectCategory: (id: CategoryId) => void;
  onOpenBlingModal: () => void;
}

export function Footer({ storeSettings, onSelectCategory, onOpenBlingModal }: FooterProps) {
  const cleanPhone = storeSettings.whatsappNumber.replace(/\D/g, '');
  const waUrl = `https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`}?text=${encodeURIComponent(
    'Olá! Vim pelo catálogo da Livraria Manancial e gostaria de tirar uma dúvida.'
  )}`;

  return (
    <footer id="main-footer" className="bg-stone-900 text-white border-t border-stone-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Brand & Identity */}
          <div className="space-y-4">
            <Logo size="lg" variant="dark" />
            <p className="font-serif italic text-sm text-stone-400 leading-relaxed">
              O manancial da Palavra de Deus para alimentar sua fé e ministério. Catálogo completo de Bíblias, devocionais e literatura cristã com estoque atualizado em tempo real via Bling ERP.
            </p>
            <div className="flex items-center gap-2 font-sans text-xs text-emerald-400 font-semibold uppercase tracking-wider">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Estoque integrado via Bling ERP</span>
            </div>
          </div>

          {/* Col 2: Quick Links / Categories */}
          <div className="space-y-4">
            <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">
              Categorias Literárias
            </h3>
            <ul className="space-y-2.5 font-serif text-sm text-stone-300">
              <li>
                <button
                  onClick={() => onSelectCategory('biblias')}
                  className="hover:text-white hover:italic transition-all text-left"
                >
                  Bíblias de Estudo & Tradicionais
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('devocionais')}
                  className="hover:text-white hover:italic transition-all text-left"
                >
                  Devocionais Diários & Anuais
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('teologia')}
                  className="hover:text-white hover:italic transition-all text-left"
                >
                  Teologia Sistemática & Comentários
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('vida-crista')}
                  className="hover:text-white hover:italic transition-all text-left"
                >
                  Vida Cristã & Crescimento
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('familia')}
                  className="hover:text-white hover:italic transition-all text-left"
                >
                  Casamento, Filhos & Família
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('infantil')}
                  className="hover:text-white hover:italic transition-all text-left"
                >
                  Bíblias Infantis & Juvenil
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Store Information */}
          <div className="space-y-4">
            <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">
              Atendimento & Loja Física
            </h3>
            <ul className="space-y-3 font-sans text-xs text-stone-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {storeSettings.address}, {storeSettings.neighborhood} - {storeSettings.cityState}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                <span>{storeSettings.businessHours}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                <span>{storeSettings.email}</span>
              </li>
            </ul>
          </div>

          {/* Col 4: WhatsApp Orders & Bling status */}
          <div className="space-y-4">
            <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">
              Pedidos via WhatsApp
            </h3>
            <p className="font-serif italic text-xs text-stone-400 leading-relaxed">
              Monte seu carrinho no catálogo e envie sua seleção diretamente para nossos livreiros no WhatsApp.
            </p>
            <a
              id="footer-whatsapp-button"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 w-full py-3 px-5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full font-sans text-xs font-bold uppercase tracking-widest transition-all shadow-md"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Chamar: {storeSettings.displayPhone}</span>
            </a>

            <div className="pt-2">
              <button
                onClick={onOpenBlingModal}
                className="font-sans text-[11px] text-stone-500 hover:text-stone-300 underline decoration-dotted"
              >
                Gerenciar Conexão com Bling ERP
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs text-stone-500">
          <div>
            © {new Date().getFullYear()} {storeSettings.storeName}. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Catálogo oficial com consulta de estoque em tempo real</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
