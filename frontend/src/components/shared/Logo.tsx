import React from 'react'

type LogoProps = {
  size?: number
  className?: string
}

export function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Sleek monochrome gradient matching the minimalist brand */}
        <linearGradient id="io-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#09090b" />
          <stop offset="100%" stopColor="#27272a" />
        </linearGradient>
      </defs>

      {/* Main "io" ligature */}
      {/* 'i' stem - a rounded vertical capsule */}
      <rect x="20" y="32" width="15" height="34" rx="7.5" fill="url(#io-gradient)" />
      
      {/* 'i' dot */}
      <circle cx="27.5" cy="18" r="7.5" fill="url(#io-gradient)" />
      
      {/* Connector bridge blending 'i' and 'o' seamlessly at the bottom */}
      <rect x="25" y="52.5" width="23" height="13.5" rx="6.75" fill="url(#io-gradient)" />

      {/* 'o' circle - elegant thick donut shape */}
      <circle cx="62" cy="56" r="22" stroke="url(#io-gradient)" strokeWidth="13" fill="none" />

      {/* Beautiful 4-point sparkle at the top right of the 'o' */}
      <path
        d="M80,18 Q80,32 94,32 Q80,32 80,46 Q80,32 66,32 Q80,32 80,18 Z"
        fill="#71717a"
      />
    </svg>
  )
}
