interface KosSymbolProps {
  className?: string
}

/**
 * Kos symbol — two concentric rings with large orange Spark center
 * Uses accent color from theme (currentColor) for the rings
 */
export function KosSymbol({ className }: KosSymbolProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="100" cy="100" r="78" stroke="currentColor" strokeWidth="15"/>
      <circle cx="100" cy="100" r="55" stroke="currentColor" strokeWidth="15"/>
      <circle cx="100" cy="100" r="32" fill="#FC7A1E"/>
    </svg>
  )
}
