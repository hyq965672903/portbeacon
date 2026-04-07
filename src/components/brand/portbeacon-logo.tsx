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
        <linearGradient id={jadeGradientId} x1="7" x2="33" y1="6" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d5f2e3" />
          <stop offset="0.5" stopColor="#45b787" />
          <stop offset="1" stopColor="#1a6840" />
        </linearGradient>
        <linearGradient id={goldGradientId} x1="13" x2="27" y1="12" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f7e8aa" />
          <stop offset="1" stopColor="#c8a45d" />
        </linearGradient>
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="1.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="1" y="1" width="38" height="38" rx="12" fill="#0b1f24" />
      <rect x="1" y="1" width="38" height="38" rx="12" fill="#45b787" fillOpacity="0.08" />
      <rect x="2" y="2" width="36" height="36" rx="11" stroke={`url(#${jadeGradientId})`} strokeOpacity="0.58" />
      <path d="M10.5 20H15.8" stroke={`url(#${jadeGradientId})`} strokeLinecap="round" strokeWidth="2.2" />
      <path d="M24.2 20H29.5" stroke={`url(#${jadeGradientId})`} strokeLinecap="round" strokeWidth="2.2" />
      <path d="M20 8.8V14.2" stroke={`url(#${jadeGradientId})`} strokeLinecap="round" strokeWidth="2.2" />
      <path d="M20 25.8V31.2" stroke={`url(#${jadeGradientId})`} strokeLinecap="round" strokeWidth="2.2" />
      <path d="M15.7 20L20 14.2L24.3 20L20 25.8L15.7 20Z" stroke={`url(#${goldGradientId})`} strokeLinejoin="round" strokeWidth="2" />
      <circle cx="10.5" cy="20" r="2.1" fill="#d5f2e3" filter={`url(#${glowId})`} />
      <circle cx="29.5" cy="20" r="2.1" fill="#d5f2e3" filter={`url(#${glowId})`} />
      <circle cx="20" cy="8.8" r="2.1" fill="#d5f2e3" filter={`url(#${glowId})`} />
      <circle cx="20" cy="31.2" r="2.1" fill="#d5f2e3" filter={`url(#${glowId})`} />
      <circle cx="20" cy="20" r="2.8" fill="#45b787" filter={`url(#${glowId})`} />
      <path d="M13.4 13.4C11.7 15.1 10.8 17.4 10.8 20C10.8 22.6 11.7 24.9 13.4 26.6" stroke="#d5f2e3" strokeLinecap="round" strokeWidth="1.35" opacity="0.55" />
      <path d="M26.6 13.4C28.3 15.1 29.2 17.4 29.2 20C29.2 22.6 28.3 24.9 26.6 26.6" stroke="#d5f2e3" strokeLinecap="round" strokeWidth="1.35" opacity="0.55" />

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
