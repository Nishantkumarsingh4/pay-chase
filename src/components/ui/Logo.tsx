import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  href?: string;
  className?: string;
}

export function LogoIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <div
      className={`relative rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 p-[1.5px] shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 group-hover:scale-105 transition-all duration-300 flex items-center justify-center ${className}`}
    >
      {/* Inner glass background */}
      <div className="w-full h-full rounded-[10px] bg-slate-950/80 backdrop-blur-md flex items-center justify-center relative overflow-hidden">
        {/* Ambient glow accent */}
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-transparent to-violet-400/20 pointer-events-none" />

        {/* Unique PayChase Geometric Monogram (Electric P with Speed Arrow) */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/5 h-3/5 text-white drop-shadow-[0_2px_8px_rgba(99,102,241,0.6)]"
        >
          <defs>
            <linearGradient id="paychaseGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#818CF8" />
              <stop offset="0.5" stopColor="#6366F1" />
              <stop offset="1" stopColor="#A855F7" />
            </linearGradient>
            <linearGradient id="boltGrad" x1="12" y1="10" x2="26" y2="24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" />
              <stop offset="1" stopColor="#818CF8" />
            </linearGradient>
          </defs>

          {/* Stem & curve of 'P' */}
          <path
            d="M8 6C8 4.89543 8.89543 4 10 4H18C22.4183 4 26 7.58172 26 12C26 16.4183 22.4183 20 18 20H13V26C13 27.1046 12.1046 28 11 28H10C8.89543 28 8 27.1046 8 26V6Z"
            fill="url(#paychaseGrad)"
          />

          {/* Speed / Chase Arrow Notch Cutout inside loop */}
          <path
            d="M13 9H17.5C19.433 9 21 10.567 21 12.5C21 14.433 19.433 16 17.5 16H13V9Z"
            fill="#030712"
          />

          {/* Dynamic forward kinetic dart */}
          <path
            d="M16 10.5L20 12.5L16 14.5L17.2 12.5L16 10.5Z"
            fill="url(#boltGrad)"
          />
        </svg>
      </div>
    </div>
  );
}

export function Logo({
  size = 'md',
  showText = true,
  href = '/dashboard',
  className = '',
}: LogoProps) {
  const iconSizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const textClasses = {
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl',
  };

  const content = (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none group cursor-pointer ${className}`}>
      <LogoIcon className={iconSizeClasses[size]} />
      {showText && (
        <span className={`text-white transition-colors duration-200 ${textClasses[size]}`}>
          Pay<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-violet-400">Chase</span>
          <span className="text-indigo-400">.</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

export default Logo;
