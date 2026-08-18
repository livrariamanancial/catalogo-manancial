interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
  showSubtitle?: boolean;
}

export function Logo({ size = 'md', variant = 'light', showSubtitle = true }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const textSizes = {
    sm: { title: 'text-lg', sub: 'text-[9px] tracking-[0.2em]' },
    md: { title: 'text-xl', sub: 'text-[11px] tracking-[0.25em]' },
    lg: { title: 'text-2xl', sub: 'text-[13px] tracking-[0.3em]' },
    xl: { title: 'text-3xl', sub: 'text-[15px] tracking-[0.35em]' },
  };

  return (
    <div id="livraria-manancial-logo" className="flex items-center gap-3.5 select-none cursor-pointer group">
      {/* Stylized Artistic Monogram Emblem */}
      <div className={`relative flex items-center justify-center shrink-0 ${sizeClasses[size]} rounded-full ${variant === 'dark' ? 'bg-stone-800 text-white' : 'bg-stone-900 text-stone-50'} shadow-xs group-hover:scale-105 transition-transform duration-300`}>
        <span className="font-serif italic font-black text-lg sm:text-xl">M</span>
      </div>

      {/* Typography with Artistic Flair: Bold Serif + Italic Accent */}
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline gap-1.5">
          <span className={`font-serif font-black tracking-tight uppercase ${variant === 'dark' ? 'text-white' : 'text-stone-900'} ${textSizes[size].title}`}>
            Manancial
          </span>
          <span className={`font-serif font-light italic lowercase ${variant === 'dark' ? 'text-stone-400' : 'text-stone-500'} ${size === 'xl' ? 'text-xl' : size === 'lg' ? 'text-lg' : 'text-sm'}`}>
            livraria
          </span>
        </div>
        {showSubtitle && (
          <span className={`font-sans uppercase font-semibold text-[9px] tracking-[0.28em] mt-0.5 ${variant === 'dark' ? 'text-emerald-400' : 'text-emerald-800'}`}>
            Catálogo & Estoque Bling
          </span>
        )}
      </div>
    </div>
  );
}
