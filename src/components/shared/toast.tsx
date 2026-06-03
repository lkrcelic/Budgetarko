import { useState, useEffect, useCallback } from 'react'
import { Check, X } from 'lucide-react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

// Module-level ref — same pattern as the prototype's toastFn
let _addToast: ((msg: string, type: Toast['type']) => void) | null = null

/**
 * Show a success toast (green checkmark).
 * Requires <ToastHost /> to be mounted in the tree.
 */
export function toast(message: string): void {
  _addToast?.(message, 'success')
}

/**
 * Show an error toast (red X).
 * Requires <ToastHost /> to be mounted in the tree.
 */
export function toastError(message: string): void {
  _addToast?.(message, 'error')
}

/**
 * Mount once at the app root (outside Routes so it persists across navigation).
 */
export function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast['type']) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2600)
  }, [])

  useEffect(() => {
    _addToast = addToast
    return () => {
      _addToast = null
    }
  }, [addToast])

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-8 left-1/2 z-[200] flex -translate-x-1/2 flex-col items-center gap-2"
    >
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-[9px] rounded-[13px] px-4 py-3 text-[14px] font-semibold text-white shadow-[0_10px_30px_rgba(22,36,29,.25)] animate-toast-in ${
            t.type === 'error' ? 'bg-bred' : 'bg-bink'
          }`}
        >
          {t.type === 'error'
            ? <X size={16} color="rgba(255,255,255,0.8)" />
            : <Check size={16} color="#7fe0b0" />
          }
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
