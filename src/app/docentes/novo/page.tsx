'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const inp =
  'w-full h-11 px-3.5 rounded-md border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition'

function Secao({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <section className="px-6 md:px-8 py-6 border-b border-slate-200">
      <div className="flex items-center gap-3 mb-5">
        <span className="w-7 h-7 rounded-full bg-brand-900 text-white text-xs font-bold flex items-center justify-center">{n}</span>
        <h4 className="text-sm font-bold uppercase tracking-wide text-brand-900">{titulo}</h4>
        <span className="flex-1 h-px bg-slate-200" />
      </div>
      {children}
    </section>
  )
}

function Campo({ label, obrig, dica, children }: { label: string; obrig?: boolean; dica?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
        {label} {obrig && <span className="text-rose-600">*</span>}
      </label>
      {children}
      {dica && <p className="text-xs text-slate-500 mt-1.5">{dica}</p>}
    </div>
  )
}

export default function NovoDocente() {
  const router = useRouter()
  const [f, setF] = useState({ nome: '', email: '', grau: '', nivel: 'Doutorado', esp: '' })
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value })
  const chips = f.esp.split(',').map(s => s.trim()).filter(Boolean)

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setMsg('')
    const { error } = await supabase.from('docentes').insert({
      nome: f.nome, email: f.email, grau: f.grau, nivel: f.nivel, especialidades: chips,
    })
    setSaving(false)
    if (error) return setMsg(error.message)
    router.push('/docentes')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-2">
        <Link href="/docentes" className="hover:text-brand-700">Docentes & Currículos</Link>
        <i className="fa-solid fa-chevron-right text-[9px]" />
        <span className="text-slate-700 font-medium">Novo docente</span>
      </nav>

      <form onSubmit={guardar} className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
        <header className="bg-brand-900 text-white px-6 md:px-8 py-6 border-b-4 border-amber-400 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl">
            <i className="fa-solid fa-user-plus" />
          </div>
          <div>
            <h3 className="text-lg font-bold leading-tight">Registo de Docente / Investigador</h3>
            <p className="text-xs text-sky-100 mt-0.5">Preencha os dados abaixo. Os campos marcados com <b>*</b> são obrigatórios.</p>
          </div>
        </header>

        <Secao n={1} titulo="Identificação">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Campo label="Nome completo" obrig>
              <input required className={inp} value={f.nome} onChange={set('nome')} placeholder="Ex.: Carlos Eduardo Manuel" />
            </Campo>
            <Campo label="Email institucional" obrig dica="Será usado como identificador único do docente.">
              <input required type="email" className={inp} value={f.email} onChange={set('email')} placeholder="nome@instituicao.ao" />
            </Campo>
          </div>
        </Secao>

        <Secao n={2} titulo="Formação académica">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Campo label="Formação / Grau" obrig>
              <input required className={inp} value={f.grau} onChange={set('grau')} placeholder="Ex.: Doutor em Inteligência Artificial" />
            </Campo>
            <Campo label="Nível académico" obrig>
              <select className={inp} value={f.nivel} onChange={set('nivel')}>
                <option>Doutorado</option>
                <option>Mestrado</option>
                <option>Licenciatura</option>
              </select>
            </Campo>
          </div>
        </Secao>

        <Secao n={3} titulo="Áreas de especialidade">
          <Campo label="Especialidades" dica="Separe as áreas por vírgula. São usadas pela IA para escolher os júris.">
            <input className={inp} value={f.esp} onChange={set('esp')} placeholder="Ex.: Redes, Cibersegurança, Bases de Dados" />
          </Campo>
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {chips.map((c, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-brand-50 text-brand-800 text-xs font-semibold border border-brand-100">{c}</span>
              ))}
            </div>
          )}
        </Secao>

        {msg && (
          <div className="mx-6 md:mx-8 mt-6 flex items-start gap-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <i className="fa-solid fa-circle-exclamation mt-0.5" /><span>{msg}</span>
          </div>
        )}

        <footer className="px-6 md:px-8 py-4 mt-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <Link href="/docentes" className="h-10 px-5 inline-flex items-center rounded-md border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Cancelar
          </Link>
          <button disabled={saving} className="h-10 px-6 rounded-md bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition">
            {saving ? 'A guardar...' : 'Guardar docente'}
          </button>
        </footer>
      </form>
    </div>
  )
}
