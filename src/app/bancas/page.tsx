'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, fmtData } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { pode } from '@/lib/perfis'
import { ROTULOS, PAPEIS } from '@/lib/matching'

type Banca = {
  id: string; tema: string; estudante: string; data_hora: string; modo: string
  orientador: { nome: string } | null
  juri_membros: { papel: string; compatibilidade: number | null; docente: { nome: string } | null }[]
}

export default function Bancas() {
  const { perfil } = useAuth()
  const [l, setL] = useState<Banca[]>([])
  const load = useCallback(async () => {
    const { data } = await supabase.from('juris')
      .select('id,tema,estudante,data_hora,modo,orientador:docentes!orientador_id(nome),juri_membros(papel,compatibilidade,docente:docentes(nome))')
      .order('data_hora')
    setL((data ?? []) as unknown as Banca[])
  }, [])
  useEffect(() => { load() }, [load])

  async function apagar(id: string) {
    if (window.confirm('Cancelar este júri?')) { await supabase.from('juris').delete().eq('id', id); load() }
  }
  const aval = perfil.perfil === 'avaliador'

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{aval ? 'A Minha Banca' : 'Bancas Agendadas'}</h2>
      {l.map(b => (
        <div key={b.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
          <div className="flex justify-between gap-4">
            <div><p className="font-bold">{b.estudante}</p><p className="text-sm text-slate-500">{b.tema}</p>
              <p className="text-xs text-slate-400 mt-1">{fmtData(b.data_hora)} • Orientador: {b.orientador?.nome} • {b.modo === 'auto' ? 'Gerado pela IA' : 'Manual'}</p></div>
            <div className="flex gap-4 self-start text-xs font-semibold shrink-0">
              {pode(perfil.perfil, 'imprimir') && <Link href={`/bancas/${b.id}`} className="text-brand-700 hover:underline"><i className="fa-solid fa-print mr-1" />Imprimir</Link>}
              {pode(perfil.perfil, 'cancelar') && <button onClick={() => apagar(b.id)} className="text-rose-600"><i className="fa-solid fa-trash mr-1" />Cancelar</button>}
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            {PAPEIS.map((p, i) => {
              const m = b.juri_membros.find(x => x.papel === p)
              return <div key={p} className="bg-slate-50 border border-slate-200 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-slate-400">{ROTULOS[i]}</p>
                <p className="text-sm font-medium">{m?.docente?.nome ?? '—'}</p>{m?.compatibilidade != null && !aval && <p className="text-xs text-slate-500">{m.compatibilidade}%</p>}</div>
            })}
          </div>
        </div>
      ))}
      {!l.length && <p className="text-slate-400 text-sm">{aval ? 'Ainda não tem nenhuma banca agendada.' : 'Sem júris agendados.'}</p>}
    </div>
  )
}
