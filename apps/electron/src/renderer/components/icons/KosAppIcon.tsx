import kosIsotipo from "@/assets/kos_isotipo.svg"

interface KosAppIconProps {
  className?: string
  size?: number
}

/**
 * KosAppIcon - Displays the Kos Spark Origin isotipo
 */
export function KosAppIcon({ className, size = 64 }: KosAppIconProps) {
  return (
    <img
      src={kosIsotipo}
      alt="Kos"
      width={size}
      height={size}
      className={className}
    />
  )
}
