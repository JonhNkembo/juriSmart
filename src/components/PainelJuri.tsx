'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, fmtData } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { PAPEL_CURTO } from '@/lib/matching'
import { CATEGORIAS, type Item } from '@/lib/types'

type Defesa = {
  id: string; tema: string; estudante: string; data_hora: string; estado: string; orientador_id: string; local: string | null
  juri_membros: { docente_id: string; papel: string }[]
}
type Doc = { grau: string; nivel: string; especialidades: string[]; disponivel: boolean }

export default function PainelJuri() {
  const { perfil } = useAuth()
  const [defs, setDefs] = useState<Defesa[]>([])
  const [itens, setItens] = useState<Item[]>([])
  const [doc, setDoc] = useState<Doc | null>(null)
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    (async () => {
      const { data: j } = await supabase.from('juris')
        .select('id,tema,estudante,data_hora,estado,orientador_id,local,juri_membros(docente_id,papel)').order('data_hora')
      setDefs((j ?? []) as Defesa[])
      if (perfil.docente_id) {
        const { data: i } = await supabase.from('curriculo_itens').select('*').eq('docente_id', perfil.docente_id)
        setItens((i ?? []) as Item[])
        const { data: d } = await supabase.from('docentes').select('grau,nivel,especialidades,disponivel').eq('id', perfil.docente_id).single()
        setDoc(d as Doc | null)
      }
      setPronto(true)
    })()
  }, [perfil.docente_id])

  const papel = (d: Defesa) =>
    d.orientador_id === perfil.docente_id ? 'Orientador'
      : PAPEL_CURTO[d.juri_membros.find(m => m.docente_id === perfil.docente_id)?.papel ?? ''] ?? ''
  const proximas = defs.filter(d => d.estado !== 'examinada' && new Date(d.data_hora).getTime() >= Date.now())
  const examinadas = defs.filter(d => d.estado === 'examinada')
  const seccoes = new Set(itens.map(i => i.categoria)).size

  const passos = [
    { ok: !!doc && doc.especialidades.length > 0, t: 'Indicar as suas especialidades', href: '/conta' },
    { ok: itens.length >= 3, t: 'Adicionar pelo menos 3 itens ao currículo', href: '/curriculo' },
    { ok: seccoes >= 3, t: 'Ter itens em pelo menos 3 secções diferentes', href: '/curriculo' },
    { ok: !!doc?.disponivel, t: 'Estar disponível para integrar júris', href: '/conta' },
    { ok: !!perfil.foto_url, t: 'Colocar uma foto de perfil', href: '/conta' },
  ]
  const pct = Math.round((passos.filter(p => p.ok).length / passos.length) * 100)
  const seguinte = proximas[0]

  const cartoes = [
    ['Próximas defesas', proximas.length, 'fa-calendar-day', 'bg-blue-50 text-brand-600'],
    ['Defesas examinadas', examinadas.length, 'fa-circle-check', 'bg-emerald-50 text-emerald-600'],
    ['Itens no currículo', itens.length, 'fa-book-open', 'bg-purple-50 text-purple-600'],
    ['Perfil completo', `${pct}%`, 'fa-user-check', 'bg-amber-50 text-amber-600'],
  ] as const

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-xl font-bold">Olá, {perfil.nome.split(' ')[0]}</h2>
        <p className="text-sm text-slate-500 mt-1">{doc ? `${doc.grau} · ${doc.nivel}` : 'Painel do Júri'}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cartoes.map(([t, v, ic, cl]) => (
          <div key={t} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-between">
            <div><p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t}</p><h3 className="text-3xl font-extrabold mt-1">{pronto ? v : '–'}</h3></div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${cl}`}><i className={`fa-solid ${ic}`} /></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Próxima defesa</h3>
              <Link href="/bancas" className="text-xs font-semibold text-brand-600">Ver todas →</Link>
            </div>
            {seguinte ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="sm:w-40 bg-brand-900 text-white rounded-xl p-4 text-center border-b-4 border-amber-400">
                  <p className="text-3xl font-extrabold leading-none">{new Date(seguinte.data_hora).getDate()}</p>
                  <p className="text-xs uppercase mt-1">{new Date(seguinte.data_hora).toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' })}</p>
                  <p className="text-xs mt-2"><i className="fa-regular fa-clock mr-1" />{new Date(seguinte.data_hora).toLocaleTimeString('pt-AO', { timeStyle: 'short' })}</p>
                </div>
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold"><i className="fa-solid fa-gavel mr-1.5" />O seu papel: {papel(seguinte)}</span>
                  <p className="font-bold text-lg mt-2">{seguinte.estudante}</p>
                  <p className="text-sm text-slate-600">{seguinte.tema}</p>
                  <p className="text-xs text-slate-400 mt-1">{fmtData(seguinte.data_hora)}</p>
                  <p className="text-xs text-sky-800 font-semibold mt-1"><i className="fa-solid fa-location-dot mr-1.5" />Local: {seguinte.local || 'a definir'}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400"><i className="fa-regular fa-calendar mr-2" />Não tem defesas agendadas. Quando for escolhido para uma banca, recebe um email e ela aparece aqui.</p>
            )}
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">O meu currículo</h3>
              <Link href="/curriculo" className="text-xs font-semibold text-brand-600">Adicionar / editar →</Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map(c => {
                const n = itens.filter(i => i.categoria === c.key).length
                return <span key={c.key} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${n ? 'bg-brand-50 text-brand-800 border-brand-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}><i className={`fa-solid ${c.icon} mr-1.5`} />{c.label}: {n}</span>
              })}
            </div>
          </section>
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 h-fit">
          <h3 className="text-lg font-bold">Estado do perfil</h3>
          <p className="text-xs text-slate-500 mb-3">Um perfil completo ajuda o sistema a escolher o júri certo para cada tema.</p>
          <div className="w-full bg-slate-100 rounded-full h-2 mb-4"><div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
          <ul className="space-y-2">
            {passos.map(p => (
              <li key={p.t} className="text-sm">
                {p.ok
                  ? <span className="text-slate-500"><i className="fa-solid fa-circle-check text-emerald-500 mr-2" />{p.t}</span>
                  : <Link href={p.href} className="text-slate-800 hover:text-brand-700"><i className="fa-regular fa-circle text-slate-300 mr-2" />{p.t}</Link>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
