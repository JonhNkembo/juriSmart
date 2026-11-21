'use client'
import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { supabase, recuperacao } from '@/lib/supabase'
import { AuthCtx } from '@/lib/auth'
import { rotaPermitida, type Perfil } from '@/lib/perfis'
import Sidebar from './Sidebar'
import Landing from './Landing'
import TopoApp from './TopoApp'
import Barra from './Barra'

const SO_SEM_SESSAO = ['/login', '/cadastro', '/recuperar']
const PUBLICAS = [...SO_SEM_SESSAO, '/redefinir', '/confirmado']
const Carregando = () => (
  <div className="h-screen flex items-center justify-center text-slate-400 text-sm">
    <i className="fa-solid fa-circle-notch fa-spin mr-2" />A carregar...
  </div>
)

const btnAviso = 'h-11 px-6 rounded-md bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold'

function Aviso({ tom, icone, titulo, texto, children, espera = false }: {
  tom: 'aviso' | 'info'; icone: string; titulo: string; texto: string; children: React.ReactNode; espera?: boolean
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-brand-900 to-brand-700">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center border-t-4 border-amber-400">
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl ${tom === 'aviso' ? 'bg-amber-100 text-amber-600' : 'bg-sky-100 text-brand-700'}`}><i className={`fa-solid ${icone}`} /></div>
        <h2 className="text-xl font-bold text-slate-800 mt-4">{titulo}</h2>
        <p className="text-sm text-slate-600 mt-2">{texto}</p>
        {espera && <Barra indeterminada altura="h-1.5" className="mt-5" rotulo="À espera de aprovação" />}
        <div className="mt-6 flex flex-col items-center">{children}</div>
      </div>
    </div>
  )
}

export default function AuthShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [pronto, setPronto] = useState(false)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [semPerfil, setSemPerfil] = useState(false)
  const [rec, setRec] = useState(false)
  const publica = PUBLICAS.includes(path)
  const uid = session?.user.id

  const carregarPerfil = useCallback(async (id: string) => {
    const { data } = await supabase.from('perfis').select('*').eq('id', id).maybeSingle()
    setPerfil(data as Perfil | null); setSemPerfil(!data)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setPronto(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((ev, s) => {
      setSession(s)
      if (ev === 'PASSWORD_RECOVERY' && window.location.pathname !== '/redefinir') { setRec(true); router.replace('/redefinir') }
    })
    return () => sub.subscription.unsubscribe()
  }, [router])

  // Link de recuperação que caiu noutra página: levar sempre para "Nova palavra-passe"
  useEffect(() => {
    if (recuperacao.ativa) {
      recuperacao.ativa = false
      if (path !== '/redefinir') { setRec(true); router.replace('/redefinir') }
    }
  }, [path, router])
  useEffect(() => { if (rec && path === '/redefinir') setRec(false) }, [rec, path])

  // Conta pendente: volta a verificar de 20 em 20 segundos, para entrar assim que for aprovada
  useEffect(() => {
    if (!uid || perfil?.estado !== 'pendente') return
    const t = setInterval(() => carregarPerfil(uid), 20000)
    return () => clearInterval(t)
  }, [uid, perfil?.estado, carregarPerfil])

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

  // sem sessão: volta a mostrar a página inicial (o atributo só esconde-a enquanto se confirma a sessão)
  useEffect(() => { if (pronto && !session) document.documentElement.removeAttribute('data-sessao') }, [pronto, session])

  const permitido = perfil ? rotaPermitida(path, perfil.perfil) : true
  useEffect(() => {
    if (!pronto) return
    if (!session && !publica && path !== '/') router.replace('/login')
    else if (session && SO_SEM_SESSAO.includes(path)) router.replace('/')
    else if (perfil && !permitido) router.replace('/bancas')
  }, [pronto, session, publica, perfil, permitido, router])

  if (path === '/' && !rec && (!pronto || !session)) return <Landing />
  if (!pronto || rec || (!session && !publica && path !== '/') || (session && SO_SEM_SESSAO.includes(path))) return <Carregando />
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
  if (perfil && !perfil.estado) {
    return (
      <Aviso tom="info" icone="fa-database" titulo="Base de dados desatualizada"
        texto="Falta atualizar a base de dados. No SQL Editor do Supabase, execute o ficheiro supabase/perfis.sql e depois atualize esta página.">
        <button onClick={() => supabase.auth.signOut()} className={btnAviso}>Terminar sessão</button>
      </Aviso>
    )
  }
  if (perfil?.estado === 'pendente') {
    return (
      <Aviso espera tom="aviso" icone="fa-hourglass-half" titulo="Aguarde a aprovação do administrador"
        texto="A sua conta foi criada com sucesso. Só terá acesso ao sistema depois de o administrador a aprovar. Esta página atualiza-se sozinha assim que isso acontecer.">
        <button onClick={() => carregarPerfil(perfil.id)} className={btnAviso}><i className="fa-solid fa-rotate mr-2" />Verificar agora</button>
        <button onClick={() => supabase.auth.signOut()} className="mt-3 text-sm font-semibold text-slate-500 hover:text-slate-700">Terminar sessão</button>
      </Aviso>
    )
  }
  if (perfil?.estado === 'desativado') {
    return (
      <Aviso tom="aviso" icone="fa-user-lock" titulo="Conta temporariamente indisponível"
        texto="A sua conta encontra-se desativada. Tente mais tarde — brevemente voltaremos.">
        <button onClick={() => supabase.auth.signOut()} className={btnAviso}>Terminar sessão</button>
      </Aviso>
    )
  }
  if (!perfil || !permitido) return <Carregando />

  return (
    <AuthCtx.Provider value={{ perfil, recarregar: () => carregarPerfil(perfil.id) }}>
      <div className="print-reset h-screen flex flex-col md:flex-row overflow-hidden">
        <Sidebar perfil={perfil} onSair={() => supabase.auth.signOut()} />
        <div className="print-reset flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopoApp perfil={perfil} />
          <main className="print-reset flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </AuthCtx.Provider>
  )
}
