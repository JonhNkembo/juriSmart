'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { inp, traduzErro, Erro, Senha } from '@/components/AuthLayout'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setMsg('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    setLoading(false)
    if (error) setMsg(traduzErro(error.message))
    // em caso de sucesso, o AuthShell detecta a sessão e abre o painel
  }

  return (
    <form onSubmit={entrar} className="space-y-5">
      <div>
        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Email</label>
        <input required type="email" className={inp} value={email} onChange={e => setEmail(e.target.value)}
          placeholder="nome@instituicao.ao" autoComplete="email" />
      </div>
      <div>
        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Palavra-passe</label>
        <Senha value={senha} onChange={setSenha} placeholder="••••••••" />
        <div className="text-right mt-2"><Link href="/recuperar" className="text-xs font-semibold text-brand-700 hover:underline">Esqueceu a palavra-passe?</Link></div>
      </div>
      <Erro msg={msg} />
      <button disabled={loading} className="w-full h-11 rounded-md bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition">
        {loading ? 'A entrar...' : 'Entrar'}
      </button>
    </form>
  )
}
