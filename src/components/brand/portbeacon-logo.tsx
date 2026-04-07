import { useId, type SVGProps } from "react";

import { cn } from "@/lib/utils";

type PortBeaconLogoProps = SVGProps<SVGSVGElement> & {
  markOnly?: boolean;
};

export function PortBeaconLogo({ className, markOnly = true, ...props }: PortBeaconLogoProps) {
  const width = markOnly ? 40 : 148;
  const id = useId().replace(/:/g, "");
  const gradientId = `${id}-portbeacon-mark`;
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
        <linearGradient id={gradientId} x1="7" x2="33" y1="4" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9ff8ea" />
          <stop offset="0.48" stopColor="#13d9c4" />
          <stop offset="1" stopColor="#087f77" />
        </linearGradient>
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="1" y="1" width="38" height="38" rx="12" fill="currentColor" fillOpacity="0.1" />
      <rect x="1" y="1" width="38" height="38" rx="12" stroke={`url(#${gradientId})`} strokeOpacity="0.52" strokeWidth="1.4" />
      <path
        d="M11 26.5h9.5c4.6 0 8.5-3.7 8.5-8.5 0-4.2-3.1-7.8-7.2-8.4"
        stroke={`url(#${gradientId})`}
        strokeLinecap="round"
        strokeWidth="2.4"
      />
      <path
        d="M11 13.5h7.3c2.5 0 4.4 1.9 4.4 4.2s-1.9 4.2-4.4 4.2H16"
        stroke={`url(#${gradientId})`}
        strokeLinecap="round"
        strokeWidth="2.4"
      />
      <circle cx="12" cy="13.5" r="2" fill="#e6fff9" filter={`url(#${glowId})`} />
      <circle cx="12" cy="26.5" r="2" fill="#e6fff9" filter={`url(#${glowId})`} />
      <circle cx="28.8" cy="18" r="2.6" fill="#13d9c4" filter={`url(#${glowId})`} />
      <path d="M30.6 13.3c2 1 3.4 2.6 4 4.7-.6 2.1-2 3.8-4 4.8" stroke="#9ff8ea" strokeLinecap="round" strokeWidth="1.6" opacity="0.92" />

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
