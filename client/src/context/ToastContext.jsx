import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

const ToastContext = createContext()

const STYLES = {
  success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: '✓' },
  error:   { bg: 'bg-red-500/10',     border: 'border-red-500/30',     text: 'text-red-400',     icon: '✕' },
  info:    { bg: 'bg-sky-500/10',     border: 'border-sky-500/30',     text: 'text-sky-400',     icon: 'i' },
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const nextToastId = useRef(0)
  const timeoutIds = useRef(new Map())

  useEffect(() => () => {
    timeoutIds.current.forEach((timeoutId) => clearTimeout(timeoutId))
  }, [])

  const showToast = useCallback((message, type = 'info') => {
    const id = nextToastId.current++
    setToasts((prev) => [...prev, { id, message, type }])
    const timeoutId = setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
      timeoutIds.current.delete(id)
    }, 4000)
    timeoutIds.current.set(id, timeoutId)
  }, [])

  const dismissToast = (id) => {
    clearTimeout(timeoutIds.current.get(id))
    timeoutIds.current.delete(id)
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* toast stack — fixed bottom-right, stacks upward */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm px-4 sm:px-0 max-sm:right-0">
        {toasts.map((t) => {
          const style = STYLES[t.type] || STYLES.info
          return (
            <div
              key={t.id}
              className={`
                flex items-start gap-3 rounded-lg border ${style.border} ${style.bg}
                backdrop-blur-md px-4 py-3 shadow-lg
                animate-[toast-in_0.25s_ease-out]
              `}
              role="status"
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${style.bg} ${style.text} text-xs font-bold`}>
                {style.icon}
              </span>
              <p className="text-sm text-white/90 leading-snug flex-1">{t.message}</p>
              <button
                onClick={() => dismissToast(t.id)}
                className="text-white/40 hover:text-white/80 transition-colors text-sm leading-none"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)