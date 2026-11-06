'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { pode } from '@/lib/perfis'
import { CATEGORIAS, type Docente } from '@/lib/types'

export default function Docentes() {
  const { perfil } = useAuth()
  const [docs, setDocs] = useState<Docente[]>([])
  const [sel, setSel] = useState('')
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    const { data } = await supabase.from('docentes').select('*, curriculo_itens(*)').order('nome')
    const l = (data ?? []) as Docente[]
    setDocs(l); setSel(s => s || l[0]?.id || '')
  }, [])
  useEffect(() => { load() }, [load])

  const lista = docs.filter(d => [d.nome, d.grau, ...d.especialidades, ...d.curriculo_itens.map(i => i.titulo)].join(' ').toLowerCase().includes(q.toLowerCase()))
  const d = docs.find(x => x.id === sel)
  const editavel = !!d && (pode(perfil.perfil, 'gerir_docentes') || (pode(perfil.perfil, 'editar_curriculo_proprio') && d.id === perfil.docente_id))

  async function add(cat: string, label: string) {
    const titulo = d && editavel && window.prompt(`Novo item em "${label}":`)
    if (!d || !titulo) return
    await supabase.from('curriculo_itens').insert({ docente_id: d.id, categoria: cat, titulo }); load()
  }
  async function toggle() {
    if (d && editavel) { await supabase.from('docentes').update({ disponivel: !d.disponivel }).eq('id', d.id); load() }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row justify-between items-center gap-4">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por docente, formação, publicações ou especialidade..." className="w-full md:w-96 px-4 py-2.5 text-sm rounded-xl border border-slate-300" />
        {pode(perfil.perfil, 'gerir_docentes') && (
          <Link href="/docentes/novo" className="bg-brand-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl"><i className="fa-solid fa-plus mr-2" />Novo Docente / Investigador</Link>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 space-y-2 max-h-[750px] overflow-y-auto">
          <h4 className="text-xs font-bold text-slate-400 uppercase px-2">Docentes Registados</h4>
          {lista.map(x => (
            <button key={x.id} onClick={() => setSel(x.id)} className={`w-full text-left p-3 rounded-xl border ${x.id === sel ? 'border-brand-500 bg-brand-50' : 'border-slate-200'}`}>
              <p className="font-semibold text-sm">{x.nome}{x.id === perfil.docente_id && <span className="ml-2 text-[10px] text-brand-700 font-bold">(você)</span>}</p>
              <p className="text-xs text-slate-500">{x.grau}</p>
            </button>
          ))}
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
          {d ? (<>
            <div className="border-b border-slate-100 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div><h3 className="text-xl font-bold">{d.nome}</h3><p className="text-sm font-medium text-brand-600">{d.grau}</p><p className="text-xs text-slate-400">{d.email}</p></div>
              <button onClick={toggle} disabled={!editavel} className={`px-3 py-1 text-xs font-bold rounded-full disabled:cursor-default ${d.disponivel ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{d.disponivel ? 'Disponível para Júris' : 'Indisponível'}</button>
            </div>
            <h4 className="font-bold text-sm mb-3">{editavel ? 'Clique numa secção para adicionar dados ao currículo:' : 'Currículo (apenas consulta):'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50"><i className="fa-solid fa-graduation-cap text-brand-600" /><h5 className="font-bold text-sm mt-2">Nível Académico</h5><p className="text-xs text-slate-500">{d.nivel}</p></div>
              {CATEGORIAS.map(c => {
                const itens = d.curriculo_itens.filter(i => i.categoria === c.key)
                return (
                  <button key={c.key} onClick={() => add(c.key, c.label)} disabled={!editavel}
                    className={`text-left border border-slate-200 rounded-xl p-4 bg-slate-50 transition disabled:cursor-default ${editavel ? 'hover:border-brand-500' : ''}`}>
                    <div className="flex justify-between"><i className={`fa-solid ${c.icon} text-brand-600`} />{editavel && <i className="fa-solid fa-plus-circle text-slate-400" />}</div>
                    <h5 className="font-bold text-sm mt-2">{c.label}</h5>
                    <p className="text-xs text-slate-500 mt-1">{itens.length} registo(s)</p>
                    {itens.slice(0, 2).map(i => <p key={i.id} className="text-xs text-slate-400 truncate">• {i.titulo}</p>)}
                  </button>
                )
              })}
            </div>
          </>) : <p className="text-slate-400 text-sm">Nenhum docente registado.</p>}
        </div>
      </div>
    </div>
  )
}
