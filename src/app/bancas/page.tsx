'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { notificar } from '@/lib/notificar'
import { useAuth } from '@/lib/auth'
import { pode } from '@/lib/perfis'
import Avatar from '@/components/Avatar'
import { ROTULOS, PAPEIS, PAPEL_CURTO } from '@/lib/matching'

type Banca = {
  id: string; tema: string; estudante: string; data_hora: string; modo: string
  estado: string; examinada_em: string | null; local: string | null; estudante_id: string | null
  orientador_id: string; orientador: { nome: string } | null
  juri_membros: { docente_id: string; papel: string; compatibilidade: number | null; justificacao: string | null; docente: { nome: string; grau: string } | null }[]
}

export default function Bancas() {
  const { perfil } = useAuth()
  const [l, setL] = useState<Banca[]>([])
  const [carregou, setCarregou] = useState(false)
  const [aviso, setAviso] = useState<{ ok: boolean; txt: string } | null>(null)
  const [fotos, setFotos] = useState<Record<string, string | null>>({})
  const load = useCallback(async () => {
    const { data } = await supabase.from('juris')
      .select('id,tema,estudante,data_hora,modo,estado,examinada_em,local,estudante_id,orientador_id,orientador:docentes!orientador_id(nome),juri_membros(docente_id,papel,compatibilidade,justificacao,docente:docentes(nome,grau))')
      .order('data_hora')
    setL((data ?? []) as unknown as Banca[]); setCarregou(true)
    if (pode(perfil.perfil, 'cancelar')) {
      const { data: f } = await supabase.from('perfis').select('id,foto_url').eq('perfil', 'avaliador')
      setFotos(Object.fromEntries((f ?? []).map(x => [x.id as string, x.foto_url as string | null])))
    }
  }, [perfil.perfil])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    try {
      const a = sessionStorage.getItem('jurismart_aviso')
      if (a) { setAviso(JSON.parse(a)); sessionStorage.removeItem('jurismart_aviso') }
    } catch { /* sem armazenamento */ }
  }, [])

  async function examinar(b: Banca) {
    if (!window.confirm(`Marcar a banca de ${b.estudante} como examinada? O estudante, o orientador e os júris serão avisados por email.`)) return
    setAviso(null)
    const { error } = await supabase.from('juris').update({ estado: 'examinada', examinada_em: new Date().toISOString() }).eq('id', b.id)
    if (error) return setAviso({ ok: false, txt: error.message })
    const r = await notificar('examinada', b.id)
    setAviso({ ok: r.ok, txt: `Banca marcada como examinada. ${r.txt}` })
    load()
  }
  async function reabrir(b: Banca) {
    if (!window.confirm('Reabrir esta banca (voltar a "agendada")? Não é enviado nenhum email.')) return
    const { error } = await supabase.from('juris').update({ estado: 'agendada', examinada_em: null }).eq('id', b.id)
    setAviso(error ? { ok: false, txt: error.message } : { ok: true, txt: 'Banca reaberta.' })
    load()
  }
  async function reenviar(b: Banca) {
    setAviso({ ok: true, txt: 'A enviar emails...' })
    setAviso(await notificar('convocatoria', b.id))
  }

  async function apagar(id: string) {
    if (window.confirm('Excluir esta banca? Esta acção não pode ser desfeita.')) { await supabase.from('juris').delete().eq('id', id); load() }
  }
  const aval = perfil.perfil === 'avaliador'
  const juri = perfil.perfil === 'juri'
  const meuPapel = (b: Banca) =>
    b.orientador_id === perfil.docente_id ? 'Orientador'
      : PAPEL_CURTO[b.juri_membros.find(m => m.docente_id === perfil.docente_id)?.papel ?? ''] ?? ''

  return (
    <div className="space-y-5 max-w-5xl">
      <h2 className="text-xl font-bold">{aval ? 'A Minha Banca' : juri ? 'As Minhas Defesas' : 'Bancas Agendadas'}</h2>
      {aviso && <p className={`text-sm ${aviso.ok ? 'text-emerald-700' : 'text-rose-600'}`}><i className={`fa-solid ${aviso.ok ? 'fa-circle-check' : 'fa-circle-exclamation'} mr-2`} />{aviso.txt}</p>}
      {l.map(b => {
        const d = new Date(b.data_hora)
        const dias = Math.ceil((d.getTime() - Date.now()) / 86400000)
        const futura = d.getTime() >= Date.now()
        const examinada = b.estado === 'examinada'
        return (
          <article key={b.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <div className="sm:w-44 shrink-0 bg-brand-900 text-white p-5 text-center border-b-4 sm:border-b-0 sm:border-r-4 border-amber-400">
                <p className="text-4xl font-extrabold leading-none">{d.getDate()}</p>
                <p className="text-sm uppercase mt-1">{d.toLocaleDateString('pt-AO', { month: 'long' })} {d.getFullYear()}</p>
                <p className="text-sm mt-2"><i className="fa-regular fa-clock mr-1" />{d.toLocaleTimeString('pt-AO', { timeStyle: 'short' })}</p>
                <span className={`inline-block mt-3 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${examinada ? 'bg-emerald-400 text-emerald-950' : futura ? 'bg-amber-400 text-brand-900' : 'bg-white/20'}`}>
                  {examinada ? 'Examinada' : futura ? (dias <= 0 ? 'Hoje' : `Faltam ${dias} dia${dias > 1 ? 's' : ''}`) : 'Por examinar'}
                </span>
              </div>
              <div className="flex-1 p-5">
                <div className="flex justify-between gap-4">
                  <div>
                    {juri && <span className="inline-block mb-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold"><i className="fa-solid fa-gavel mr-1.5" />O seu papel: {meuPapel(b)}</span>}
                    <div className="flex items-center gap-3">
                      <Avatar nome={b.estudante} foto={aval ? perfil.foto_url : fotos[b.estudante_id ?? '']} tam={aval ? 64 : 44} className="ring-2 ring-slate-100" />
                      <div>
                        <p className="font-bold text-lg leading-tight">{b.estudante}</p>
                        <p className="text-sm text-slate-600">{aval && <span className="font-semibold text-slate-500">O seu tema: </span>}{b.tema}</p>
                      </div>
                    </div>
                    <p className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-sky-50 text-sky-900 border border-sky-100 text-xs font-semibold">
                      <i className="fa-solid fa-location-dot" />Local: {b.local || 'a definir'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Orientador: {b.orientador?.nome} • {b.modo === 'auto' ? 'Mesa escolhida pela IA' : 'Mesa escolhida manualmente'}</p>
                    {examinada && <p className="text-xs text-emerald-700 font-semibold mt-1"><i className="fa-solid fa-circle-check mr-1" />Examinada{b.examinada_em ? ` em ${new Date(b.examinada_em).toLocaleDateString('pt-AO')}` : ''}</p>}
                  </div>
                  <div className="flex gap-4 self-start text-xs font-semibold shrink-0">
                    {pode(perfil.perfil, 'imprimir') && <Link href={`/bancas/${b.id}`} className="text-brand-700 hover:underline"><i className="fa-solid fa-print mr-1" />Imprimir</Link>}
                    {pode(perfil.perfil, 'cancelar') && (examinada
                      ? <button onClick={() => reabrir(b)} className="text-slate-500 hover:underline"><i className="fa-solid fa-rotate-left mr-1" />Reabrir</button>
                      : <button onClick={() => examinar(b)} className="text-emerald-700 hover:underline"><i className="fa-solid fa-circle-check mr-1" />Marcar examinada</button>)}
                    {pode(perfil.perfil, 'cancelar') && !examinada && <button onClick={() => reenviar(b)} className="text-sky-700 hover:underline"><i className="fa-solid fa-envelope mr-1" />Avisar</button>}
                    {pode(perfil.perfil, 'cancelar') && <Link href={`/agendar/${b.id}`} className="text-amber-600 hover:underline"><i className="fa-solid fa-pen-to-square mr-1" />Editar</Link>}
                    {pode(perfil.perfil, 'cancelar') && <button onClick={() => apagar(b.id)} className="text-rose-600 hover:underline"><i className="fa-solid fa-trash mr-1" />Excluir</button>}
                  </div>
                </div>

                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mt-5 mb-2">Mesa examinadora e justificação</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PAPEIS.map((p, i) => {
                    const m = b.juri_membros.find(x => x.papel === p)
                    if (!m?.docente) return null
                    return (
                      <div key={p} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <p className="text-[10px] font-bold uppercase text-slate-400">{ROTULOS[i]}</p>
                        <p className="text-sm font-semibold">{m.docente.nome}</p>
                        <p className="text-xs text-slate-500">{m.docente.grau}</p>
                        {m.justificacao && <p className="text-xs text-slate-600 mt-2 leading-snug"><i className="fa-solid fa-lightbulb text-amber-500 mr-1.5" />{m.justificacao}</p>}
                        {!aval && m.compatibilidade != null && <p className="text-xs text-slate-400 mt-1">Compatibilidade: {m.compatibilidade}%</p>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </article>
        )
      })}
      {carregou && !l.length && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-sm">
          <i className="fa-regular fa-calendar text-3xl mb-3 block" />
          {aval ? 'Ainda não tem nenhuma banca agendada. Quando o administrador agendar a sua defesa, ela aparece aqui com a data e a justificação da mesa.' : juri ? 'Ainda não foi designado para nenhuma defesa. Quando for, aparece aqui com o seu papel (presidente, vogal ou suplente).' : 'Sem júris agendados.'}
        </div>
      )}
    </div>
  )
}
