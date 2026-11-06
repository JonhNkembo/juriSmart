'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { PERFIS, PRIVILEGIOS, ROTULO_ACAO, type Acao } from '@/lib/perfis'
import { inp, traduzErro, Senha } from '@/components/AuthLayout'

const lbl = 'block text-[13px] font-semibold text-slate-700 mb-1.5'
type Aviso = { ok: boolean; txt: string } | null

function Cartao({ icone, titulo, children }: { icone: string; titulo: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <h3 className="bg-brand-900 text-white text-sm font-bold px-6 py-3 border-b-4 border-amber-400"><i className={`fa-solid ${icone} mr-2`} />{titulo}</h3>
      <div className="p-6">{children}</div>
    </section>
  )
}
const Msg = ({ a }: { a: Aviso }) => a ? (
  <p className={`text-sm mt-4 ${a.ok ? 'text-emerald-700' : 'text-rose-600'}`}>
    <i className={`fa-solid ${a.ok ? 'fa-circle-check' : 'fa-circle-exclamation'} mr-2`} />{a.txt}
  </p>
) : null
const Botao = ({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) => (
  <button disabled={disabled} className="mt-5 h-10 px-6 rounded-md bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white text-sm font-semibold shadow-sm">{children}</button>
)

export default function Conta() {
  const { perfil, recarregar } = useAuth()
  const [dados, setDados] = useState({ nome: perfil.nome, telefone: perfil.telefone ?? '', email: perfil.email })
  const [aDados, setADados] = useState<Aviso>(null)
  const [doc, setDoc] = useState({ grau: '', nivel: 'Doutorado', esp: '', disponivel: true })
  const [aDoc, setADoc] = useState<Aviso>(null)
  const [pw, setPw] = useState({ nova: '', conf: '' })
  const [aPw, setAPw] = useState<Aviso>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!perfil.docente_id) return
    supabase.from('docentes').select('grau,nivel,especialidades,disponivel').eq('id', perfil.docente_id).single()
      .then(({ data }) => data && setDoc({ grau: data.grau, nivel: data.nivel, esp: (data.especialidades as string[]).join(', '), disponivel: data.disponivel }))
  }, [perfil.docente_id])

  async function guardarDados(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setADados(null)
    const { error } = await supabase.from('perfis').update({ nome: dados.nome, telefone: dados.telefone || null }).eq('id', perfil.id)
    if (error) { setBusy(false); return setADados({ ok: false, txt: error.message }) }
    await supabase.auth.updateUser({ data: { nome: dados.nome } })
    if (perfil.docente_id) await supabase.from('docentes').update({ nome: dados.nome }).eq('id', perfil.docente_id)
    let txt = 'Dados guardados.'
    if (dados.email !== perfil.email) {
      const { error: e2 } = await supabase.auth.updateUser({ email: dados.email })
      if (e2) { setBusy(false); return setADados({ ok: false, txt: traduzErro(e2.message) }) }
      txt = 'Dados guardados. Enviámos um email de confirmação para o novo endereço; o email só muda depois de o confirmar.'
    }
    await recarregar(); setBusy(false); setADados({ ok: true, txt })
  }

  async function guardarDocente(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setADoc(null)
    const { error } = await supabase.from('docentes').update({
      grau: doc.grau, nivel: doc.nivel, disponivel: doc.disponivel,
      especialidades: doc.esp.split(',').map(s => s.trim()).filter(Boolean),
    }).eq('id', perfil.docente_id!)
    setBusy(false)
    setADoc(error ? { ok: false, txt: error.message } : { ok: true, txt: 'Dados de docente guardados.' })
  }

  async function mudarSenha(e: React.FormEvent) {
    e.preventDefault(); setAPw(null)
    if (pw.nova.length < 6) return setAPw({ ok: false, txt: 'A palavra-passe deve ter pelo menos 6 caracteres.' })
    if (pw.nova !== pw.conf) return setAPw({ ok: false, txt: 'As palavras-passe não coincidem.' })
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw.nova })
    setBusy(false)
    if (error) return setAPw({ ok: false, txt: traduzErro(error.message) })
    setPw({ nova: '', conf: '' }); setAPw({ ok: true, txt: 'Palavra-passe alterada.' })
  }

  const info = PERFIS[perfil.perfil]
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-brand-700 text-white text-2xl font-bold flex items-center justify-center">{perfil.nome.charAt(0).toUpperCase()}</div>
        <div>
          <h2 className="text-xl font-bold">{perfil.nome}</h2>
          <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-brand-50 text-brand-800 border border-brand-100 text-xs font-bold">{info.rotulo} ({info.detalhe})</span>
        </div>
      </div>

      <Cartao icone="fa-id-card" titulo="Dados da conta">
        <form onSubmit={guardarDados}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div><label className={lbl}>Nome completo</label><input required className={inp} value={dados.nome} onChange={e => setDados({ ...dados, nome: e.target.value })} /></div>
            <div><label className={lbl}>Telefone</label><input className={inp} value={dados.telefone} onChange={e => setDados({ ...dados, telefone: e.target.value })} placeholder="+244 9XX XXX XXX" /></div>
            <div className="md:col-span-2"><label className={lbl}>Email</label><input required type="email" className={inp} value={dados.email} onChange={e => setDados({ ...dados, email: e.target.value })} /></div>
          </div>
          <Botao disabled={busy}>Guardar alterações</Botao><Msg a={aDados} />
        </form>
      </Cartao>

      {perfil.docente_id && (
        <Cartao icone="fa-user-graduate" titulo="Dados de docente / investigador">
          <form onSubmit={guardarDocente}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className={lbl}>Formação / Grau</label><input required className={inp} value={doc.grau} onChange={e => setDoc({ ...doc, grau: e.target.value })} /></div>
              <div><label className={lbl}>Nível académico</label>
                <select className={inp} value={doc.nivel} onChange={e => setDoc({ ...doc, nivel: e.target.value })}><option>Doutorado</option><option>Mestrado</option><option>Licenciatura</option></select></div>
              <div className="md:col-span-2"><label className={lbl}>Especialidades (separadas por vírgula)</label><input className={inp} value={doc.esp} onChange={e => setDoc({ ...doc, esp: e.target.value })} /></div>
            </div>
            <label className="flex items-center gap-2 mt-4 text-sm text-slate-700">
              <input type="checkbox" checked={doc.disponivel} onChange={e => setDoc({ ...doc, disponivel: e.target.checked })} /> Disponível para integrar júris
            </label>
            <Botao disabled={busy}>Guardar dados de docente</Botao><Msg a={aDoc} />
          </form>
        </Cartao>
      )}

      <Cartao icone="fa-key" titulo="Alterar palavra-passe">
        <form onSubmit={mudarSenha}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div><label className={lbl}>Nova palavra-passe</label><Senha novo value={pw.nova} onChange={v => setPw({ ...pw, nova: v })} placeholder="Mínimo 6 caracteres" /></div>
            <div><label className={lbl}>Confirmar</label><Senha novo value={pw.conf} onChange={v => setPw({ ...pw, conf: v })} placeholder="Repita a palavra-passe" /></div>
          </div>
          <Botao disabled={busy}>Alterar palavra-passe</Botao><Msg a={aPw} />
        </form>
      </Cartao>

      <Cartao icone="fa-shield-halved" titulo="O meu perfil e privilégios">
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          {(Object.keys(ROTULO_ACAO) as Acao[]).map(a => {
            const tem = PRIVILEGIOS[perfil.perfil].includes(a)
            return <li key={a} className={`text-sm ${tem ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
              <i className={`fa-solid ${tem ? 'fa-check text-emerald-600' : 'fa-xmark text-slate-400'} w-5`} />{ROTULO_ACAO[a]}</li>
          })}
        </ul>
        {info.notas.map(n => <p key={n} className="text-xs text-slate-500 mt-3"><i className="fa-solid fa-circle-info mr-1.5" />{n}</p>)}
        <p className="text-xs text-slate-500 mt-3">O perfil só pode ser alterado por um Administrador.</p>
      </Cartao>
    </div>
  )
}
