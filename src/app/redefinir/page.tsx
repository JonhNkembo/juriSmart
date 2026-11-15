'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AuthLayout, { traduzErro, Erro, Estado, Senha, ForcaSenha, btn } from '@/components/AuthLayout'

type Fase = 'verificando' | 'form' | 'invalido' | 'ok'

export default function Redefinir() {
  const [fase, setFase] = useState<Fase>('verificando')
  const [nova, setNova] = useState('')
  const [conf, setConf] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(ev => { if (ev === 'PASSWORD_RECOVERY') setFase('form') })
    let t: ReturnType<typeof setTimeout> | undefined
    // o link cria uma sessão de recuperação; se ainda não existir, espera um instante e tenta uma última vez
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) return setFase('form')
      t = setTimeout(async () => {
        const { data: d2 } = await supabase.auth.getSession()
        setFase(f => (f === 'verificando' ? (d2.session ? 'form' : 'invalido') : f))
      }, 2500)
    })
    return () => { sub.subscription.unsubscribe(); if (t) clearTimeout(t) }
  }, [])

  async function guardar(e: React.FormEvent) {
    e.preventDefault(); setMsg('')
    if (nova.length < 6) return setMsg('A palavra-passe deve ter pelo menos 6 caracteres.')
    if (nova !== conf) return setMsg('As palavras-passe não coincidem.')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: nova })
    if (error) { setLoading(false); return setMsg(traduzErro(error.message)) }
    await supabase.auth.signOut()
    setLoading(false); setFase('ok')
  }

  return (
    <AuthLayout title="Nova palavra-passe" subtitle="Escolha uma palavra-passe segura para a sua conta."
      rodape={<>Voltar ao <Link href="/login" className="font-semibold text-brand-700 hover:underline">login</Link></>}>
      {fase === 'verificando' && (
        <Estado tom="info" icone="fa-circle-notch fa-spin" titulo="A verificar o link...">
          <p>Um instante, estamos a confirmar o seu pedido.</p>
        </Estado>
      )}
      {fase === 'invalido' && (
        <Estado tom="erro" icone="fa-link-slash" titulo="Link inválido ou expirado">
          <p>Este link já não é válido. Peça um novo para continuar.</p>
          <Link href="/recuperar" className={btn}>Pedir novo link</Link>
        </Estado>
      )}
      {fase === 'ok' && (
        <Estado tom="ok" icone="fa-circle-check" titulo="Palavra-passe alterada!">
          <p>Já pode iniciar sessão com a nova palavra-passe.</p>
          <Link href="/login" className={btn}>Ir para o login</Link>
        </Estado>
      )}
      {fase === 'form' && (
        <form onSubmit={guardar} className="space-y-5">
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Nova palavra-passe</label>
            <Senha novo value={nova} onChange={setNova} placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Confirmar palavra-passe</label>
            <Senha novo value={conf} onChange={setConf} placeholder="Repita a palavra-passe" />
            <ForcaSenha senha={nova} conf={conf} />
          </div>
          <Erro msg={msg} />
          <button disabled={loading} className="w-full h-11 rounded-md bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition">
            {loading ? 'A guardar...' : 'Guardar nova palavra-passe'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
