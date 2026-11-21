'use client'
import { useMemo, useState } from 'react'
import { assignSlots, rankDocentes, ROTULOS } from '@/lib/matching'
import type { Docente } from '@/lib/types'
import Barra from '../Barra'

const novo = (n: string, nome: string, grau: string, nivel: Docente['nivel'], esp: string[], itens: string[]): Docente => ({
  id: n, nome, email: '', grau, nivel, especialidades: esp, disponivel: true,
  curriculo_itens: itens.map((titulo, i) => ({ id: `${n}-${i}`, categoria: 'publicacoes', titulo, ano: null })),
})

// Docentes inventados para a demonstração. A lógica de escolha é a mesma do sistema.
const DOCENTES: Docente[] = [
  novo('1', 'Dra. Helena Cardoso', 'Doutora em Engenharia Informática', 'Doutorado', ['Redes', 'Segurança Informática', 'Criptografia'], ['Segurança em redes sem fios', 'Protocolos de autenticação em redes']),
  novo('2', 'Dr. Mateus Ngola', 'Doutor em Ciência de Dados', 'Doutorado', ['Aprendizagem Automática', 'Estatística', 'Saúde Pública'], ['Aprendizagem automática aplicada à saúde pública', 'Previsão de doenças com dados clínicos']),
  novo('3', 'Msc. Isabel Domingos', 'Mestre em Sistemas de Informação', 'Mestrado', ['Bases de Dados', 'Sistemas de Informação', 'Gestão Escolar'], ['Modelação de bases de dados para gestão escolar', 'Sistemas de informação em escolas']),
  novo('4', 'Msc. Paulo Kiala', 'Mestre em Redes de Computadores', 'Mestrado', ['Redes', 'Infraestruturas', 'Cloud'], ['Redes sem fios em zonas rurais', 'Virtualização e cloud']),
  novo('5', 'Dr. Joaquim Bento', 'Doutor em Engenharia de Software', 'Doutorado', ['Engenharia de Software', 'Web', 'Qualidade'], ['Testes automáticos em aplicações web', 'Arquitectura de sistemas web']),
  novo('6', 'Lic. Rosa Tchissola', 'Licenciada em Informática', 'Licenciatura', ['Programação', 'Web', 'Apoio ao Ensino'], ['Plataformas web para o ensino']),
  novo('7', 'Msc. Eduardo Samba', 'Mestre em Inteligência Artificial', 'Mestrado', ['Inteligência Artificial', 'Visão Computacional'], ['Detecção de objectos em imagens', 'Reconhecimento de padrões']),
]
const CARGAS: Record<string, number> = { '1': 1, '2': 0, '3': 2, '4': 1, '5': 3, '6': 0, '7': 1 }

const EXEMPLOS = [
  'Segurança em redes sem fios numa universidade',
  'Aprendizagem automática para prever doenças',
  'Base de dados para a gestão de uma escola',
  'Reconhecimento de imagens com inteligência artificial',
]

export default function Simulador() {
  const [tema, setTema] = useState(EXEMPLOS[0])
  const [orientador, setOrientador] = useState('5')

  const mesa = useMemo(
    () => assignSlots(rankDocentes({ tema, palavras: '', orientador }, DOCENTES, CARGAS, new Set())),
    [tema, orientador]
  )
  const nomeOrientador = DOCENTES.find(d => d.id === orientador)?.nome

  return (
    <div className="bg-white border border-paper-300 shadow-sm">
      <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="p-6 sm:p-7 bg-paper-50 border-b md:border-b-0 md:border-r border-paper-200">
          <label htmlFor="sim-tema" className="block text-[13px] font-semibold text-slate-700 mb-1.5">Tema do TCC</label>
          <textarea id="sim-tema" rows={3} value={tema} onChange={e => setTema(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 resize-none" />
          <div className="flex flex-wrap gap-2 mt-3">
            {EXEMPLOS.map(e => (
              <button key={e} onClick={() => setTema(e)}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${tema === e ? 'bg-brand-900 text-white border-brand-900' : 'bg-white text-slate-600 border-slate-300 hover:border-brand-600 hover:text-brand-700'}`}>
                {e}
              </button>
            ))}
          </div>
          <label htmlFor="sim-or" className="block text-[13px] font-semibold text-slate-700 mt-5 mb-1.5">Orientador (fica fora da mesa)</label>
          <select id="sim-or" value={orientador} onChange={e => setOrientador(e.target.value)}
            className="w-full h-11 px-3 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20">
            {DOCENTES.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
          <p className="text-xs text-slate-500 mt-4 leading-relaxed">Sete docentes inventados, com especialidades e currículo. A escolha usa a mesma pontuação do sistema: 60% afinidade com o tema, 20% nível académico e 20% equilíbrio de carga.</p>
        </div>

        <div className="p-6 sm:p-7">
          <p className="text-sm font-semibold text-slate-700 mb-3">Mesa sugerida</p>
          <ol className="space-y-3">
            {mesa.map((m, i) => (
              <li key={ROTULOS[i]} className="border border-slate-200 p-3.5">
                {m ? (
                  <>
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500">{ROTULOS[i]}</p>
                        <p className="font-semibold text-slate-900 truncate">{m.docente.nome}</p>
                      </div>
                      <p className="font-display text-2xl font-bold text-brand-900 shrink-0">{m.score}<span className="text-sm text-slate-400">%</span></p>
                    </div>
                    <Barra valor={m.score} cor="bg-amber-400" altura="h-1.5" className="mt-2" rotulo={`Compatibilidade de ${m.docente.nome}`} />
                    <p className="text-xs text-slate-600 mt-2 leading-snug">{m.motivo}</p>
                  </>
                ) : <p className="text-sm text-slate-400">Sem docente disponível para este lugar.</p>}
              </li>
            ))}
          </ol>
          <p className="text-xs text-slate-500 mt-3"><i className="fa-solid fa-ban mr-1.5" />{nomeOrientador} é o orientador, por isso não entra na mesa.</p>
        </div>
      </div>
    </div>
  )
}
