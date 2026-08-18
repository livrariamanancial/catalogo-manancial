import { ElementType } from 'react';
import { Category, CategoryId } from '../types';
import { 
  BookOpen, 
  BookMarked, 
  Sun, 
  Heart, 
  GraduationCap, 
  Users, 
  Award, 
  Smile, 
  Sparkles 
} from 'lucide-react';

interface CategoryNavProps {
  categories: Category[];
  selectedCategory: CategoryId;
  selectedSubcategory: string;
  onSelectCategory: (id: CategoryId) => void;
  onSelectSubcategory: (sub: string) => void;
}

const ICON_MAP: Record<string, ElementType> = {
  BookOpen,
  BookMarked,
  Sun,
  Heart,
  GraduationCap,
  Users,
  Award,
  Smile,
  Sparkles,
};

export function CategoryNav({
  categories,
  selectedCategory,
  selectedSubcategory,
  onSelectCategory,
  onSelectSubcategory,
}: CategoryNavProps) {
  const currentCategoryObj = categories.find((c) => c.id === selectedCategory);
  const subcategories = currentCategoryObj?.subcategories || [];

  return (
    <nav aria-label="Categorias do Catálogo" className="w-full bg-[#FDFCFB] border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5">
        {/* Main Category Links with Artistic Italic Flares */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const Icon = ICON_MAP[cat.iconName] || BookOpen;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                id={`category-btn-${cat.id}`}
                onClick={() => {
                  onSelectCategory(cat.id);
                  onSelectSubcategory('');
                }}
                className={`group flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-serif transition-all select-none shrink-0 cursor-pointer ${
                  isSelected
                    ? 'font-bold italic bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-950 hover:italic hover:bg-stone-100/80'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 transition-colors ${
                    isSelected ? 'text-stone-300' : 'text-stone-400 group-hover:text-stone-900'
                  }`}
                />
                <span>{cat.name}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full ml-0.5"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Subcategories (if current category has them) */}
        {subcategories.length > 0 && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-100 overflow-x-auto pb-1 no-scrollbar">
            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-stone-400 shrink-0">
              Especialidades:
            </span>
            <button
              id="subcategory-btn-all"
              onClick={() => onSelectSubcategory('')}
              className={`font-sans text-xs px-3 py-1 rounded-full transition-all shrink-0 ${
                !selectedSubcategory
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
              }`}
            >
              Todas
            </button>
            {subcategories.map((sub) => (
              <button
                key={sub}
                id={`subcategory-btn-${sub.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => onSelectSubcategory(sub === selectedSubcategory ? '' : sub)}
                className={`font-sans text-xs px-3 py-1 rounded-full transition-all shrink-0 ${
                  selectedSubcategory === sub
                    ? 'bg-stone-900 text-white font-semibold'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
