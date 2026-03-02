interface KosLogoProps {
  className?: string
}

/**
 * Kos wordmark logo — K + two-ring O with Spark center + SLAB
 * Uses accent color from theme (currentColor)
 */
export function KosLogo({ className }: KosLogoProps) {
  return (
    <svg
      viewBox="0 0 480 90"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* K */}
      <text x="0" y="68" fontFamily="Outfit, system-ui, sans-serif" fontWeight="800" fontSize="72" fill="currentColor" letterSpacing="1">K</text>

      {/* O — two rings + large Spark center */}
      <g transform="translate(80, 37)">
        <circle cx="0" cy="0" r="28" stroke="currentColor" strokeWidth="4.5"/>
        <circle cx="0" cy="0" r="20" stroke="currentColor" strokeWidth="4.5"/>
        <circle cx="0" cy="0" r="11" fill="#FC7A1E"/>
      </g>

      {/* SLAB */}
      <text x="116" y="68" fontFamily="Outfit, system-ui, sans-serif" fontWeight="800" fontSize="72" fill="currentColor" letterSpacing="1">SLAB</text>
    </svg>
  )
}
