'use client'
import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { AuthCtx } from '@/lib/auth'
import { rotaPermitida, type Perfil } from '@/lib/perfis'
import Sidebar from './Sidebar'

const PUBLICAS = ['/login', '/cadastro']
const Carregando = () => (
  <div className="h-screen flex items-center justify-center text-slate-400 text-sm">
    <i className="fa-solid fa-circle-notch fa-spin mr-2" />A carregar...
  </div>
)

export default function AuthShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [pronto, setPronto] = useState(false)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [semPerfil, setSemPerfil] = useState(false)
  const publica = PUBLICAS.includes(path)
  const uid = session?.user.id

  const carregarPerfil = useCallback(async (id: string) => {
    const { data } = await supabase.from('perfis').select('*').eq('id', id).maybeSingle()
    setPerfil(data as Perfil | null); setSemPerfil(!data)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setPronto(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (uid) carregarPerfil(uid)
    else { setPerfil(null); setSemPerfil(false) }
  }, [uid, carregarPerfil])

  // mantém o email do perfil igual ao da conta (após confirmar uma alteração de email)
  useEffect(() => {
    const e = session?.user.email
    if (perfil && e && perfil.email !== e) {
      supabase.from('perfis').update({ email: e }).eq('id', perfil.id).then(() => setPerfil({ ...perfil, email: e }))
    }
  }, [perfil, session])

  const permitido = perfil ? rotaPermitida(path, perfil.perfil) : true
  useEffect(() => {
    if (!pronto) return
    if (!session && !publica) router.replace('/login')
    else if (session && publica) router.replace('/')
    else if (perfil && !permitido) router.replace('/bancas')
  }, [pronto, session, publica, perfil, permitido, router])

  if (!pronto || (!session && !publica) || (session && publica)) return <Carregando />
  if (publica) return <>{children}</>
  if (semPerfil) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md bg-white border border-slate-200 rounded-lg shadow-md p-6 text-center">
          <i className="fa-solid fa-triangle-exclamation text-3xl text-amber-500" />
          <h2 className="font-bold text-lg mt-3">Perfil não encontrado</h2>
          <p className="text-sm text-slate-600 mt-2">A conta existe, mas não tem perfil associado. Execute o ficheiro <b>supabase/perfis.sql</b> no SQL Editor do Supabase e volte a entrar.</p>
          <button onClick={() => supabase.auth.signOut()} className="mt-5 h-10 px-5 rounded-md bg-brand-700 text-white text-sm font-semibold">Terminar sessão</button>
        </div>
      </div>
    )
  }
  if (!perfil || !permitido) return <Carregando />

  return (
    <AuthCtx.Provider value={{ perfil, recarregar: () => carregarPerfil(perfil.id) }}>
      <div className="print-reset h-screen flex flex-col md:flex-row overflow-hidden">
        <Sidebar perfil={perfil} onSair={() => supabase.auth.signOut()} />
        <main className="print-reset flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </AuthCtx.Provider>
  )
}
