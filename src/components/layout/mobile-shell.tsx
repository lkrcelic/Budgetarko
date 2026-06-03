import type { ReactNode } from 'react'

interface MobileShellProps {
  children: ReactNode
}

/**
 * Mobile layout: full-height container, overflow hidden so the
 * add-entry overlay (position:absolute, inset:0) works correctly.
 * Matches .m-root from prototype.
 */
export function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="relative h-dvh overflow-hidden bg-bbg font-sans">
      {children}
    </div>
  )
}
