interface AppLogoProps {
  /** Size type: 'sm' | 'md' | 'lg' */
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AppLogo({ size = "md", className = "" }: AppLogoProps) {
  // Determine dimensions based on size
  const dimensions = {
    sm: { container: "h-14 w-32", img: "h-12 max-w-[110px]" },
    md: { container: "h-20 w-44", img: "h-16 max-w-[160px]" },
    lg: { container: "h-28 w-56", img: "h-24 max-w-[200px]" },
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Container to carefully crop and frame the logo, keeping the athlete and the line pristine */}
      <div 
        className={`relative flex items-center justify-center overflow-hidden rounded-2xl bg-transparent transition-all duration-300 ${dimensions.container}`}
      >
        {/* Glow effect matching our electric blue theme behind the logo */}
        <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full scale-75 pointer-events-none" />
        
        {/* The user-provided Logo image containing 'pulse', 'atleta' and 'linha' */}
        <img
          src="/images/logo.png"
          alt="Pulse Logo"
          className={`object-contain transition-transform duration-300 hover:scale-105 ${dimensions.img}`}
          style={{
            filter: "drop-shadow(0 0 10px oklch(0.62 0.20 250 / 0.35))",
            objectFit: "contain",
          }}
          loading="eager"
        />
      </div>
    </div>
  );
}
