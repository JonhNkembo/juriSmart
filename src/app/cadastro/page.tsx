'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AuthLayout, { inp, traduzErro, Erro, Senha } from '@/components/AuthLayout'
import { PERFIS, PRIVILEGIOS, ROTULO_ACAO, type PerfilTipo } from '@/lib/perfis'

const lbl = 'block text-[13px] font-semibold text-slate-700 mb-1.5'
const Req = () => <span className="text-rose-600"> *</span>

export default function Cadastro() {
  const [perfil, setPerfil] = useState<PerfilTipo>('avaliador')
  const [f, setF] = useState({ nome: '', email: '', senha: '', conf: '', codigo: '', grau: '', nivel: 'Doutorado', esp: '' })
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })

  async function criar(e: React.FormEvent) {
    e.preventDefault()
    setMsg(''); setOk('')
    if (f.senha.length < 6) return setMsg('A palavra-passe deve ter pelo menos 6 caracteres.')
    if (f.senha !== f.conf) return setMsg('As palavras-passe não coincidem.')
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: f.email, password: f.senha,
      options: { data: { nome: f.nome, perfil, codigo: f.codigo, grau: f.grau, nivel: f.nivel, especialidades: f.esp } },
    })
    setLoading(false)
    if (error) return setMsg(traduzErro(error.message))
    if (data.user && data.user.identities?.length === 0) return setMsg('Este email já está registado.')
    if (!data.session) setOk('Conta criada! Enviámos um email de confirmação. Confirme-o e depois inicie sessão.')
  }

  return (
    <AuthLayout title="Criar conta" subtitle="Escolha o seu perfil e registe-se."
      rodape={<>Já tem conta? <Link href="/login" className="font-semibold text-brand-700 hover:underline">Iniciar sessão</Link></>}>
      {ok ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl"><i className="fa-solid fa-envelope-circle-check" /></div>
          <p className="text-sm text-slate-700 mt-4">{ok}</p>
          <Link href="/login" className="inline-block mt-5 h-10 leading-10 px-6 rounded-md bg-brand-700 text-white text-sm font-semibold">Ir para o login</Link>
        </div>
      ) : (
        <form onSubmit={criar} className="space-y-5">
          <div>
            <label className={lbl}>Perfil<Req /></label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PERFIS) as PerfilTipo[]).map(p => (
                <button type="button" key={p} onClick={() => setPerfil(p)}
                  className={`rounded-md border p-3 text-center transition ${perfil === p ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/20' : 'border-slate-300 hover:bg-slate-50'}`}>
                  <i className={`fa-solid ${PERFIS[p].icone} text-lg ${perfil === p ? 'text-brand-700' : 'text-slate-400'}`} />
                  <span className="block text-xs font-bold mt-1 text-slate-800">{PERFIS[p].rotulo}</span>
                  <span className="block text-[10px] text-slate-500 leading-tight">({PERFIS[p].detalhe})</span>
                </button>
              ))}
            </div>
            <div className="mt-3 rounded-md bg-slate-50 border border-slate-200 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">Privilégios deste perfil</p>
              <ul className="space-y-1">
                {PRIVILEGIOS[perfil].map(a => (
                  <li key={a} className="text-xs text-slate-700"><i className="fa-solid fa-check text-emerald-600 mr-2" />{ROTULO_ACAO[a]}</li>
                ))}
              </ul>
              {PERFIS[perfil].notas.map(n => <p key={n} className="text-[11px] text-slate-500 mt-1.5"><i className="fa-solid fa-circle-info mr-1.5" />{n}</p>)}
            </div>
          </div>

          <div><label className={lbl}>Nome completo<Req /></label>
            <input required className={inp} value={f.nome} onChange={set('nome')} placeholder="Ex.: Maria Santos" autoComplete="name" /></div>
          <div><label className={lbl}>Email<Req /></label>
            <input required type="email" className={inp} value={f.email} onChange={set('email')} placeholder="nome@instituicao.ao" autoComplete="email" /></div>

          {perfil === 'juri' && (
            <div className="rounded-md border border-slate-200 p-4 space-y-4 bg-slate-50/60">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Dados de docente / investigador</p>
              <div><label className={lbl}>Formação / Grau<Req /></label>
                <input required className={inp} value={f.grau} onChange={set('grau')} placeholder="Ex.: Mestre em Cibersegurança" /></div>
              <div><label className={lbl}>Nível académico<Req /></label>
                <select className={inp} value={f.nivel} onChange={set('nivel')}><option>Doutorado</option><option>Mestrado</option><option>Licenciatura</option></select></div>
              <div><label className={lbl}>Especialidades</label>
                <input className={inp} value={f.esp} onChange={set('esp')} placeholder="Redes, Cibersegurança" />
                <p className="text-xs text-slate-500 mt-1.5">Separe por vírgula. A IA usa isto para o escolher para júris.</p></div>
            </div>
          )}

          {perfil === 'administrador' && (
            <div><label className={lbl}>Código de administrador<Req /></label>
              <input required type="password" className={inp} value={f.codigo} onChange={set('codigo')} placeholder="Fornecido pela instituição" autoComplete="off" /></div>
          )}

          <div><label className={lbl}>Palavra-passe<Req /></label>
            <Senha novo value={f.senha} onChange={v => setF({ ...f, senha: v })} placeholder="Mínimo 6 caracteres" /></div>
          <div><label className={lbl}>Confirmar palavra-passe<Req /></label>
            <Senha novo value={f.conf} onChange={v => setF({ ...f, conf: v })} placeholder="Repita a palavra-passe" /></div>
          <Erro msg={msg} />
          <button disabled={loading} className="w-full h-11 rounded-md bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition">
            {loading ? 'A criar conta...' : 'Criar conta'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
