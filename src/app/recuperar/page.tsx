'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AuthLayout, { inp, traduzErro, Erro, Estado } from '@/components/AuthLayout'

export default function Recuperar() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [msg, setMsg] = useState('')
  const [detalhe, setDetalhe] = useState('')
  const [loading, setLoading] = useState(false)
  const [espera, setEspera] = useState(0)

  useEffect(() => {
    if (espera <= 0) return
    const t = setTimeout(() => setEspera(espera - 1), 1000)
    return () => clearTimeout(t)
  }, [espera])

  async function enviar(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true); setMsg(''); setDetalhe('')
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/redefinir` })
    setLoading(false)
    if (error) { setDetalhe(error.message); return setMsg(traduzErro(error.message)) }
    setEnviado(true); setEspera(60)
  }

  return (
    <AuthLayout title="Recuperar palavra-passe" subtitle="Enviamos-lhe um link para criar uma nova palavra-passe."
      rodape={<>Lembrou-se? <Link href="/login" className="font-semibold text-brand-700 hover:underline">Voltar ao login</Link></>}>
      {enviado ? (
        <Estado tom="ok" icone="fa-envelope-circle-check" titulo="Verifique o seu email">
          <p>Se <b>{email}</b> estiver registado, receberá em instantes um link para redefinir a palavra-passe.</p>
          <p className="text-xs text-slate-500">Não encontra? Veja a pasta de spam. O link expira passado pouco tempo.</p>
          <button onClick={() => enviar()} disabled={espera > 0 || loading} className="text-sm font-semibold text-brand-700 disabled:text-slate-400">
            {espera > 0 ? `Reenviar link (${espera}s)` : 'Reenviar link'}
          </button>
          <Erro msg={msg} detalhe={detalhe} />
        </Estado>
      ) : (
        <form onSubmit={enviar} className="space-y-5">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-sky-100 text-brand-700 flex items-center justify-center text-2xl"><i className="fa-solid fa-key" /></div>
            <p className="text-sm text-slate-600 mt-3">Indique o email da sua conta.</p>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Email</label>
            <input required type="email" className={inp} value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@instituicao.ao" autoComplete="email" />
          </div>
          <Erro msg={msg} detalhe={detalhe} />
          <button disabled={loading} className="w-full h-11 rounded-md bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition">
            {loading ? 'A enviar...' : 'Enviar link de recuperação'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
