import { createContext, useContext, useEffect, type ReactNode } from 'react'

interface PlatformPageContextValue {
  setActions: (actions: ReactNode) => void
}

const PlatformPageContext = createContext<PlatformPageContextValue | null>(null)

export function PlatformPageActionsProvider({
  children,
  setActions,
}: {
  children: ReactNode
  setActions: (actions: ReactNode) => void
}) {
  return (
    <PlatformPageContext.Provider value={{ setActions }}>
      {children}
    </PlatformPageContext.Provider>
  )
}

export function usePlatformPageActions(actions: ReactNode) {
  const ctx = useContext(PlatformPageContext)

  useEffect(() => {
    if (!ctx) return
    ctx.setActions(actions)
    return () => ctx.setActions(null)
  }, [ctx, actions])
}
