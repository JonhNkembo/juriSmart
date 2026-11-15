'use client'
import { useState } from 'react'
import Link from 'next/link'


export const inp =
  'w-full h-11 px-3.5 rounded-md border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition'

export function traduzErro(m: string) {
  if (/invalid login credentials/i.test(m)) return 'Email ou palavra-passe incorrectos.'
  if (/email not confirmed/i.test(m)) return 'Confirme o seu email antes de iniciar sessão.'
  if (/already registered|already been registered/i.test(m)) return 'Este email já está registado.'
  if (/password should be at least/i.test(m)) return 'A palavra-passe deve ter pelo menos 6 caracteres.'
  if (/database error saving new user/i.test(m)) return 'Não foi possível criar a conta. Tente novamente dentro de instantes.'
  if (/same password|different from the old/i.test(m)) return 'A nova palavra-passe deve ser diferente da atual.'
  if (/rate limit|too many|security purposes/i.test(m)) return 'Limite de envio de emails atingido. Aguarde alguns minutos (pode ir até uma hora) e tente de novo.'
  if (/fetch|network/i.test(m)) return 'Sem ligação ao servidor. Verifique a internet e o ficheiro .env.'
  return m
}

const Logo = () => (
  <div className="flex items-center space-x-3">
    <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2.5 rounded-xl text-white shadow-lg">
      <i className="fa-solid fa-graduation-cap text-xl" />
    </div>
    <div>
      <h1 className="font-bold text-lg leading-none">JúriSmart <span className="text-cyan-400 font-extrabold">AI</span></h1>
      <span className="text-xs opacity-70">Agendamento de TCC</span>
    </div>
  </div>
)

export default function AuthLayout({ title, subtitle, children, rodape }: {
  title: string; subtitle: string; children: React.ReactNode; rodape: React.ReactNode
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand-900 to-brand-700 text-white p-12 border-r-4 border-amber-400">
        <Logo />
        <div className="max-w-md">
          <h2 className="text-3xl font-extrabold leading-tight">Júris de TCC organizados com inteligência.</h2>
          <p className="text-sky-100 mt-3 text-sm">Cruze currículos, evite conflitos de horário e equilibre a carga dos docentes em poucos cliques.</p>
          <ul className="mt-8 space-y-3 text-sm">
            {['Mesa examinadora sugerida pela IA', 'Currículos e especialidades dos docentes', 'Controlo de conflitos de horário'].map(t => (
              <li key={t} className="flex items-center gap-3"><i className="fa-solid fa-circle-check text-amber-400" />{t}</li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-sky-200">© JúriSmart AI</p>
      </div>
      <div className="flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-brand-700 mb-5"><i className="fa-solid fa-arrow-left mr-2" />Página inicial</Link>
          <div className="lg:hidden mb-6 text-brand-900"><Logo /></div>
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">{subtitle}</p>
          <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">{children}</div>
          <p className="text-sm text-slate-600 text-center mt-5">{rodape}</p>
        </div>
      </div>
    </div>
  )
}

export function Erro({ msg, detalhe }: { msg: string; detalhe?: string }) {
  return msg ? (
    <div className="flex items-start gap-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <i className="fa-solid fa-circle-exclamation mt-0.5" /><span>{msg}{detalhe && <span className="block text-[11px] text-rose-400 mt-1">Detalhe técnico: {detalhe}</span>}</span>
    </div>
  ) : null
}

export function Senha({ value, onChange, placeholder, novo }: {
  value: string; onChange: (v: string) => void; placeholder?: string; novo?: boolean
}) {
  const [ver, setVer] = useState(false)
  return (
    <div className="relative">
      <input required type={ver ? 'text' : 'password'} className={`${inp} pr-11`} value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder} autoComplete={novo ? 'new-password' : 'current-password'} />
      <button type="button" onClick={() => setVer(!ver)} aria-label="Mostrar ou ocultar palavra-passe"
        className="absolute right-0 top-0 h-11 w-11 text-slate-400 hover:text-slate-600">
        <i className={`fa-solid ${ver ? 'fa-eye-slash' : 'fa-eye'}`} />
      </button>
    </div>
  )
}

export function Estado({ tom, icone, titulo, children }: {
  tom: 'ok' | 'erro' | 'info'; icone: string; titulo: string; children?: React.ReactNode
}) {
  const cor = tom === 'ok' ? 'bg-emerald-100 text-emerald-600' : tom === 'erro' ? 'bg-rose-100 text-rose-600' : 'bg-sky-100 text-brand-700'
  return (
    <div className="text-center py-4">
      <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl ${cor}`}><i className={`fa-solid ${icone}`} /></div>
      <h3 className="text-lg font-bold text-slate-800 mt-4">{titulo}</h3>
      <div className="text-sm text-slate-600 mt-2 space-y-4">{children}</div>
    </div>
  )
}

export const btn = 'inline-block h-11 leading-[2.75rem] px-6 rounded-md bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold shadow-sm transition'

export function ForcaSenha({ senha, conf }: { senha: string; conf?: string }) {
  if (!senha && !conf) return null
  const crit = [
    { ok: senha.length >= 6, t: 'Mínimo 6 caracteres' },
    { ok: /[a-zA-Z]/.test(senha) && /\d/.test(senha), t: 'Letras e números' },
    { ok: /[A-Z]/.test(senha) && /[a-z]/.test(senha), t: 'Maiúsculas e minúsculas' },
  ]
  const nivel = senha.length < 6 ? 0 : crit.filter(c => c.ok).length
  const cor = ['bg-slate-200', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500'][nivel]
  const rotulo = ['', 'Fraca', 'Média', 'Forte'][nivel]
  return (
    <div className="mt-2 space-y-2">
      {senha && (
        <>
          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1">{[1, 2, 3].map(i => <span key={i} className={`h-1.5 flex-1 rounded-full ${nivel >= i ? cor : 'bg-slate-200'}`} />)}</div>
            <span className="text-xs font-semibold text-slate-500 w-12 text-right">{rotulo}</span>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {crit.map(c => (
              <li key={c.t} className={`text-[11px] ${c.ok ? 'text-emerald-600' : 'text-slate-400'}`}>
                <i className={`fa-solid ${c.ok ? 'fa-circle-check' : 'fa-circle'} mr-1 text-[9px]`} />{c.t}
              </li>
            ))}
          </ul>
        </>
      )}
      {conf !== undefined && conf.length > 0 && (
        <p className={`text-xs font-medium ${conf === senha ? 'text-emerald-600' : 'text-rose-600'}`}>
          <i className={`fa-solid ${conf === senha ? 'fa-circle-check' : 'fa-circle-xmark'} mr-1.5`} />
          {conf === senha ? 'As palavras-passe coincidem' : 'As palavras-passe não coincidem'}
        </p>
      )}
    </div>
  )
}
