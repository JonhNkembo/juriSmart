'use client'
import { createContext, useContext } from 'react'
import type { Perfil } from './perfis'

export const AuthCtx = createContext<{ perfil: Perfil; recarregar: () => Promise<void> } | null>(null)
export function useAuth() {
  const c = useContext(AuthCtx)
  if (!c) throw new Error('useAuth fora do AuthShell')
  return c
}
