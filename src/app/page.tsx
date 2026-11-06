'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, fmtData } from '@/lib/supabase'

type Jur = { id: string; tema: string; estudante: string; data_hora: string; modo: string; orientador: { nome: string } | null }
const CORES = ['bg-brand-600', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500']

export default function Dashboard() {
  const [s, setS] = useState({ docentes: 0, juris: 0, auto: 0, proximas: 0, media: 0 })
  const [rec, setRec] = useState<Jur[]>([])
  const [esp, setEsp] = useState<[string, number][]>([])

  useEffect(() => {
    (async () => {
      const [d, j, m] = await Promise.all([
        supabase.from('docentes').select('especialidades'),
        supabase.from('juris').select('id,tema,estudante,data_hora,modo,orientador:docentes!orientador_id(nome)').order('data_hora', { ascending: false }),
        supabase.from('juri_membros').select('id', { count: 'exact', head: true }),
      ])
      const docs = d.data ?? []; const juris = (j.data ?? []) as unknown as Jur[]
      setS({
        docentes: docs.length, juris: juris.length,
        auto: juris.filter(x => x.modo === 'auto').length,
        proximas: juris.filter(x => new Date(x.data_hora) >= new Date()).length,
        media: docs.length ? Math.round(((m.count ?? 0) / docs.length) * 10) / 10 : 0,
      })
      setRec(juris.slice(0, 5))
      const c: Record<string, number> = {}
      docs.forEach(x => (x.especialidades as string[]).forEach(e => (c[e] = (c[e] ?? 0) + 1)))
      setEsp(Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 4))
    })()
  }, [])

  const total = esp.reduce((a, [, n]) => a + n, 0) || 1
  const cards = [
    ['Docentes / Investigadores', s.docentes, 'fa-user-graduate', 'bg-blue-50 text-brand-600'],
    ['Júris Agendados', s.juris, 'fa-calendar-check', 'bg-emerald-50 text-emerald-600'],
    ['Próximas Bancas', s.proximas, 'fa-hourglass-half', 'bg-amber-50 text-amber-600'],
    ['Média de Bancas/Docente', s.media, 'fa-scale-balanced', 'bg-purple-50 text-purple-600'],
  ] as const

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Visão Geral & Estatísticas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map(([t, v, ic, cl]) => (
          <div key={t} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t}</p>
              <h3 className="text-3xl font-extrabold mt-1">{v}</h3>
              {t === 'Júris Agendados' && <span className="text-xs text-slate-500"><b className="text-brand-600">{s.auto}</b> Automáticos | <b>{s.juris - s.auto}</b> Manuais</span>}
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${cl}`}><i className={`fa-solid ${ic}`} /></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-bold">Bancas Agendadas Recentes</h3>
            <Link href="/bancas" className="text-xs font-semibold text-brand-600">Ver Todas →</Link>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <thead><tr className="border-b border-slate-100 text-xs text-slate-400 uppercase">
              <th className="py-3 px-2">Candidato / Tema</th><th className="px-2">Orientador</th><th className="px-2">Data / Hora</th><th className="px-2">Modo</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rec.map(r => (
                <tr key={r.id}><td className="py-3 px-2"><b>{r.estudante}</b><br /><span className="text-xs text-slate-500">{r.tema}</span></td>
                  <td className="px-2">{r.orientador?.nome}</td><td className="px-2">{fmtData(r.data_hora)}</td>
                  <td className="px-2 text-xs">{r.modo === 'auto' ? 'IA' : 'Manual'}</td></tr>
              ))}
              {!rec.length && <tr><td colSpan={4} className="py-6 text-center text-slate-400">Sem júris agendados.</td></tr>}
            </tbody></table></div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
          <h3 className="text-lg font-bold">Distribuição de Especialidades</h3>
          <p className="text-xs text-slate-500 mb-4">Baseada nos currículos registados</p>
          <div className="space-y-4">
            {esp.map(([n, c], i) => (
              <div key={n}>
                <div className="flex justify-between text-xs font-medium mb-1"><span>{n}</span><span className="text-slate-500">{Math.round((c / total) * 100)}%</span></div>
                <div className="w-full bg-slate-100 rounded-full h-2"><div className={`${CORES[i]} h-2 rounded-full`} style={{ width: `${(c / total) * 100}%` }} /></div>
              </div>
            ))}
          </div>
          <Link href="/agendar" className="mt-6 inline-block bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg">Agendar Agora</Link>
        </div>
      </div>
    </div>
  )
}
