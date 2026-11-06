'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PAPEIS, ROTULOS } from '@/lib/matching'

type Ficha = {
  id: string; tema: string; estudante: string; data_hora: string
  orientador: { nome: string; grau: string } | null
  juri_membros: { papel: string; docente: { nome: string; grau: string } | null }[]
}

export default function ImprimirBanca() {
  const { id } = useParams<{ id: string }>()
  const [b, setB] = useState<Ficha | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    supabase.from('juris')
      .select('id,tema,estudante,data_hora,orientador:docentes!orientador_id(nome,grau),juri_membros(papel,docente:docentes(nome,grau))')
      .eq('id', id).single()
      .then(({ data, error }) => (error || !data ? setErro('Júri não encontrado.') : setB(data as unknown as Ficha)))
  }, [id])

  useEffect(() => {
    if (b && new URLSearchParams(window.location.search).get('auto') === '1') {
      const t = setTimeout(() => window.print(), 500)
      return () => clearTimeout(t)
    }
  }, [b])

  if (erro) return <p className="text-sm text-rose-600">{erro}</p>
  if (!b) return <p className="text-sm text-slate-400">A carregar...</p>

  const d = new Date(b.data_hora)
  const linhas = [
    ...(b.orientador ? [{ cargo: 'Orientador', nome: b.orientador.nome, grau: b.orientador.grau }] : []),
    ...PAPEIS.flatMap((p, i) => {
      const m = b.juri_membros.find(x => x.papel === p)
      return m?.docente ? [{ cargo: ROTULOS[i].replace(' (Avaliador)', ''), nome: m.docente.nome, grau: m.docente.grau }] : []
    }),
  ]

  return (
    <div>
      <div className="no-print max-w-3xl mx-auto mb-4 flex items-center justify-between">
        <Link href="/bancas" className="text-sm text-slate-600 hover:text-brand-700"><i className="fa-solid fa-arrow-left mr-2" />Voltar às bancas</Link>
        <button onClick={() => window.print()} className="h-10 px-5 rounded-md bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold shadow-sm">
          <i className="fa-solid fa-print mr-2" />Imprimir / Guardar PDF
        </button>
      </div>

      <article className="max-w-3xl mx-auto bg-white text-black border border-slate-300 shadow-md p-10 print:shadow-none print:border-0 print:p-0">
        <header className="text-center border-b-2 border-black pb-4">
          <p className="text-xs tracking-widest uppercase">JúriSmart AI</p>
          <h1 className="text-xl font-bold uppercase mt-2">Ficha de Convocatória de Júri</h1>
          <p className="text-sm mt-1">Defesa do Trabalho de Conclusão de Curso (TCC)</p>
          <p className="text-xs mt-2">Ref.: JS-{b.id.slice(0, 8).toUpperCase()}</p>
        </header>

        <dl className="grid grid-cols-[9rem_1fr] gap-y-2 text-sm mt-6">
          <dt className="font-bold">Candidato:</dt><dd>{b.estudante}</dd>
          <dt className="font-bold">Tema:</dt><dd>{b.tema}</dd>
          <dt className="font-bold">Data:</dt><dd className="capitalize">{d.toLocaleDateString('pt-AO', { dateStyle: 'full' })}</dd>
          <dt className="font-bold">Hora:</dt><dd>{d.toLocaleTimeString('pt-AO', { timeStyle: 'short' })}</dd>
          <dt className="font-bold">Local:</dt><dd className="border-b border-black">&nbsp;</dd>
        </dl>

        <h2 className="text-sm font-bold uppercase mt-8 mb-2">Mesa examinadora</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border border-black">
              <th className="border border-black p-2 text-left w-32">Cargo</th>
              <th className="border border-black p-2 text-left">Nome</th>
              <th className="border border-black p-2 text-left">Formação</th>
              <th className="border border-black p-2 text-left w-44">Assinatura</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(l => (
              <tr key={l.cargo} className="border border-black h-14">
                <td className="border border-black p-2 font-semibold">{l.cargo}</td>
                <td className="border border-black p-2">{l.nome}</td>
                <td className="border border-black p-2 text-xs">{l.grau}</td>
                <td className="border border-black p-2" />
              </tr>
            ))}
          </tbody>
        </table>

        <footer className="mt-12 flex justify-between text-xs">
          <span>Emitido em {new Date().toLocaleDateString('pt-AO', { dateStyle: 'long' })}</span>
          <span className="border-t border-black pt-1 w-56 text-center">O Coordenador</span>
        </footer>
      </article>
    </div>
  )
}
