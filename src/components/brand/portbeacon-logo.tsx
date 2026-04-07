import { useId, type SVGProps } from "react";

import { cn } from "@/lib/utils";

type PortBeaconLogoProps = SVGProps<SVGSVGElement> & {
  markOnly?: boolean;
};

export function PortBeaconLogo({ className, markOnly = true, ...props }: PortBeaconLogoProps) {
  const width = markOnly ? 40 : 148;
  const id = useId().replace(/:/g, "");
  const jadeGradientId = `${id}-portbeacon-jade`;
  const goldGradientId = `${id}-portbeacon-gold`;
  const glowId = `${id}-portbeacon-glow`;

  return (
    <svg
      aria-hidden="true"
      className={cn("text-[var(--primary)]", className)}
      fill="none"
      height="40"
      viewBox={`0 0 ${width} 40`}
      width={width}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient id={jadeGradientId} x1="7" x2="34" y1="7" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d5f2e3" />
          <stop offset="0.5" stopColor="#45b787" />
          <stop offset="1" stopColor="#1a6840" />
        </linearGradient>
        <linearGradient id={goldGradientId} x1="16" x2="29" y1="12" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f7e8aa" />
          <stop offset="1" stopColor="#c8a45d" />
        </linearGradient>
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="1.7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="1" y="1" width="38" height="38" rx="12" fill="#0b1f24" />
      <rect x="1" y="1" width="38" height="38" rx="12" fill="#45b787" fillOpacity="0.08" />
      <rect x="2" y="2" width="36" height="36" rx="11" stroke={`url(#${jadeGradientId})`} strokeOpacity="0.56" />
      <path d="M10.5 14.2H18.3L23.7 20L18.3 25.8H10.5" stroke={`url(#${jadeGradientId})`} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
      <path d="M24.5 14.2C28.2 15.2 30.7 17.3 31.8 20C30.7 22.7 28.2 24.8 24.5 25.8" stroke={`url(#${goldGradientId})`} strokeLinecap="round" strokeWidth="1.9" />
      <path d="M27.8 10.8C32.5 12.6 35.2 15.8 36 20C35.2 24.2 32.5 27.4 27.8 29.2" stroke="#d5f2e3" strokeLinecap="round" strokeWidth="1.2" opacity="0.42" />
      <circle cx="10.5" cy="14.2" r="2.1" fill="#d5f2e3" filter={`url(#${glowId})`} />
      <circle cx="10.5" cy="25.8" r="2.1" fill="#d5f2e3" filter={`url(#${glowId})`} />
      <circle cx="23.7" cy="20" r="3" fill="#45b787" filter={`url(#${glowId})`} />
      <path d="M16.6 17.2L23.7 20L16.6 22.8" stroke="#f7e8aa" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.35" opacity="0.9" />

      {!markOnly && (
        <g fill="currentColor">
          <text x="50" y="17" fontFamily="Manrope, sans-serif" fontSize="13" fontWeight="800" letterSpacing="0.04em">
            PortBeacon
          </text>
          <text x="51" y="29" fill="var(--muted-foreground)" fontFamily="JetBrains Mono, monospace" fontSize="7" letterSpacing="0.18em">
            PORT SIGNAL
          </text>
        </g>
      )}
    </svg>
  );
}
