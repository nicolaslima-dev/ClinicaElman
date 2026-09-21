interface NodaLogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
}

export function NodaLogo({ className, iconSize = 32, textSize = "text-xl text-white" }: NodaLogoProps) {
  return (
    <div className={`flex-shrink-0 flex items-center justify-start z-10 ${className || ''}`}>
      <a href="https://nodasolucoes.dev" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group">
        <svg width={iconSize} height={iconSize} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"
          className="shrink-0">
          <defs>
            <linearGradient id="boltGradient" x1="6" y1="2" x2="26" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="55%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#4338CA" />
            </linearGradient>
            <filter id="boltGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="1.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect x="1" y="1" width="30" height="30" rx="9" fill="#0B0F19" stroke="rgba(148,163,184,0.16)" />
          <path d="M18.5 6L10 18h5.2l-1.7 8L22 13.5h-5.2L18.5 6z" fill="url(#boltGradient)"
            filter="url(#boltGlow)" className="transition-transform duration-300 group-hover:scale-105" />
        </svg>
        <span className={`font-bold ${textSize} tracking-tight`}>
          Noda<span className="text-[#06B6D4]">.</span>
        </span>
      </a>
    </div>
  );
}
