import { createClient } from '@supabase/supabase-js'

// Guardado ANTES de criar o cliente (que limpa o endereço): a pessoa chegou por um link de recuperação?
export const recuperacao = {
  ativa: typeof window !== 'undefined' && /type=recovery/.test(window.location.hash),
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { flowType: 'implicit', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true } }
)
export const fmtData = (iso: string) =>
  new Date(iso).toLocaleString('pt-AO', { dateStyle: 'short', timeStyle: 'short' })
