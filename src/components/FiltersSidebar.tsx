import { FilterState } from '../types';
import { 
  SlidersHorizontal, 
  RotateCcw, 
  Building, 
  Layers, 
  MessageCircle 
} from 'lucide-react';

interface FiltersSidebarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  availablePublishers: string[];
  availableFormats: string[];
  totalResults: number;
}

export function FiltersSidebar({
  filters,
  onFilterChange,
  onResetFilters,
  availablePublishers,
  availableFormats,
  totalResults,
}: FiltersSidebarProps) {
  return (
    <aside aria-label="Filtros do Catálogo" className="w-full bg-[#FDFCFB] rounded-2xl border border-stone-200 p-6 space-y-7 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-stone-800" />
          <h2 className="font-sans text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold">
            Filtros & Refino
          </h2>
        </div>

        <button
          id="reset-filters-sidebar-btn"
          onClick={onResetFilters}
          className="font-sans text-[11px] text-stone-400 hover:text-stone-900 flex items-center gap-1 transition-colors uppercase tracking-wider"
          title="Limpar todos os filtros"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Limpar</span>
        </button>
      </div>

      {/* Real-time Stock Toggle (Artistic card) */}
      <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
        <label className="flex items-center justify-between cursor-pointer select-none">
          <div className="flex flex-col">
            <span className="font-serif font-bold text-sm text-stone-900">Apenas em Estoque</span>
            <span className="font-sans text-[10px] text-stone-500">Ocultar itens esgotados no Bling</span>
          </div>
          <input
            id="filter-in-stock-toggle"
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => onFilterChange({ inStockOnly: e.target.checked })}
            className="w-4 h-4 text-stone-900 rounded border-stone-300 focus:ring-stone-900 accent-stone-900 cursor-pointer"
          />
        </label>
      </div>

      {/* Sort By Order */}
      <div className="space-y-2">
        <label className="block font-sans text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">
          Ordenar Por
        </label>
        <select
          id="filter-sort-by"
          value={filters.sortBy}
          onChange={(e) => onFilterChange({ sortBy: e.target.value as FilterState['sortBy'] })}
          className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl font-sans text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-400"
        >
          <option value="relevance">Destaques & Mais Vendidos</option>
          <option value="price_asc">Menor Preço</option>
          <option value="price_desc">Maior Preço</option>
          <option value="name_asc">Título (A - Z)</option>
          <option value="stock_desc">Maior Quantidade em Estoque</option>
          <option value="newest">Lançamentos / Recentes</option>
        </select>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <label className="block font-sans text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">
          Faixa de Preço (R$)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-sans text-[10px] text-stone-400 block mb-0.5">Mínimo</span>
            <input
              type="number"
              min={0}
              placeholder="0"
              value={filters.minPrice || ''}
              onChange={(e) => onFilterChange({ minPrice: Number(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-sans text-xs text-stone-900 focus:bg-white focus:outline-none"
            />
          </div>
          <div>
            <span className="font-sans text-[10px] text-stone-400 block mb-0.5">Máximo</span>
            <input
              type="number"
              min={0}
              placeholder="400"
              value={filters.maxPrice || ''}
              onChange={(e) => onFilterChange({ maxPrice: Number(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-sans text-xs text-stone-900 focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Publishers Filter */}
      {availablePublishers.length > 0 && (
        <div className="space-y-2">
          <label className="block font-sans text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-stone-400" />
            Editoras
          </label>
          <select
            id="filter-publisher-select"
            value={filters.publisher}
            onChange={(e) => onFilterChange({ publisher: e.target.value })}
            className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl font-sans text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-400"
          >
            <option value="">Todas as Editoras</option>
            {availablePublishers.map((pub) => (
              <option key={pub} value={pub}>
                {pub}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Format / Binding */}
      {availableFormats.length > 0 && (
        <div className="space-y-2">
          <label className="block font-sans text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-stone-400" />
            Acabamento
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onFilterChange({ format: '' })}
              className={`font-sans px-2.5 py-1 rounded-lg text-xs transition-colors ${
                !filters.format
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              Todos
            </button>
            {availableFormats.map((fmt) => (
              <button
                key={fmt}
                onClick={() => onFilterChange({ format: filters.format === fmt ? '' : fmt })}
                className={`font-sans px-2.5 py-1 rounded-lg text-xs transition-colors ${
                  filters.format === fmt
                    ? 'bg-stone-900 text-white font-semibold'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Artistic Bottom Callout (matches Design HTML) */}
      <div className="mt-auto bg-stone-50 p-4 rounded-xl border border-stone-200">
        <p className="font-sans text-[10px] uppercase tracking-wider text-stone-500 leading-tight">
          Não encontrou o título que procurava?<br/>
          <span className="font-bold text-stone-900 lowercase tracking-normal text-xs block mt-1">
            Fale com nossos livreiros no WhatsApp.
          </span>
        </p>
      </div>

      {/* Results Count Badge */}
      <div className="pt-2 text-center font-sans text-[11px] uppercase tracking-wider text-stone-400">
        Exibindo <strong className="text-stone-800">{totalResults}</strong> {totalResults === 1 ? 'título' : 'títulos'}
      </div>
    </aside>
  );
}
