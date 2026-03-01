/**
 * DynamicLucideIcon - Render a Lucide icon by name.
 *
 * Uses lucide-react/dynamicIconImports for code-split lazy loading.
 * Each icon is loaded on demand — no bundle bloat from importing all 1900+ icons.
 *
 * Falls back to null if the icon name is not found in the Lucide library.
 */

import { lazy, Suspense, memo } from 'react'
import dynamicIconImports from 'lucide-react/dynamicIconImports'

type IconName = keyof typeof dynamicIconImports

interface DynamicLucideIconProps {
  /** Lucide icon name in kebab-case (e.g. "globe", "arrow-right") */
  name: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Cache of lazily-loaded icon components.
 * Prevents re-creating lazy wrappers on every render.
 */
const iconComponentCache = new Map<string, React.LazyExoticComponent<React.ComponentType<{ className?: string }>>>()

function getLazyIcon(name: string): React.LazyExoticComponent<React.ComponentType<{ className?: string }>> | null {
  if (!(name in dynamicIconImports)) return null

  const cached = iconComponentCache.get(name)
  if (cached) return cached

  const LazyIcon = lazy(async () => {
    const mod = await dynamicIconImports[name as IconName]()
    // dynamicIconImports modules export the icon as default
    return { default: mod.default }
  })
  iconComponentCache.set(name, LazyIcon)
  return LazyIcon
}

/**
 * Renders a Lucide icon by its kebab-case name.
 * Returns null if the name doesn't match a known icon.
 */
export const DynamicLucideIcon = memo(function DynamicLucideIcon({ name, className }: DynamicLucideIconProps) {
  const LazyIcon = getLazyIcon(name)
  if (!LazyIcon) return null

  return (
    <Suspense fallback={<span className={className} />}>
      <LazyIcon className={className} />
    </Suspense>
  )
})
