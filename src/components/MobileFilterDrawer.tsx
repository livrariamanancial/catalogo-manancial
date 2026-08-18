import { FilterState } from '../types';
import { X, SlidersHorizontal } from 'lucide-react';
import { FiltersSidebar } from './FiltersSidebar';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  availablePublishers: string[];
  availableFormats: string[];
  totalResults: number;
}

export function MobileFilterDrawer({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onResetFilters,
  availablePublishers,
  availableFormats,
  totalResults,
}: MobileFilterDrawerProps) {
  if (!isOpen) return null;

  return (
    <div
      id="mobile-filter-drawer-backdrop"
      className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="mobile-filter-drawer-panel"
        className="w-full max-w-xs bg-[#FDFCFB] h-full shadow-2xl flex flex-col justify-between overflow-hidden border-l border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-stone-300" />
            <h3 className="font-serif font-bold text-sm">Filtros do Catálogo</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-stone-800 text-stone-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Filters Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <FiltersSidebar
            filters={filters}
            onFilterChange={onFilterChange}
            onResetFilters={onResetFilters}
            availablePublishers={availablePublishers}
            availableFormats={availableFormats}
            totalResults={totalResults}
          />
        </div>

        {/* Apply Action Bar */}
        <div className="p-4 bg-white border-t border-stone-200">
          <button
            id="apply-mobile-filters-btn"
            onClick={onClose}
            className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-full font-sans font-bold uppercase tracking-wider text-xs shadow-md"
          >
            Ver {totalResults} {totalResults === 1 ? 'Título' : 'Títulos'}
          </button>
        </div>
      </div>
    </div>
  );
}
