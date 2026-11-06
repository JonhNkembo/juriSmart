import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
export const fmtData = (iso: string) =>
  new Date(iso).toLocaleString('pt-AO', { dateStyle: 'short', timeStyle: 'short' })
