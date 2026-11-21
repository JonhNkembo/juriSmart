'use client'
import { useState } from 'react'
import Barra from '../Barra'

/* ---------- Antes e depois ---------- */
const HOJE = [
  ['Dois lugares, à mesma hora', 'O mesmo docente é marcado em duas defesas porque ninguém cruzou as listas.'],
  ['Sempre os mesmos', 'A carga cai nos docentes mais disponíveis ou mais conhecidos.'],
  ['Júri sem ligação ao tema', 'Escolhe-se quem está livre, não quem conhece o assunto.'],
  ['O estudante sabe por terceiros', 'Data, sala e mesa chegam por mensagens soltas.'],
]
const COM = [
  ['Conflitos barrados', 'Um docente, ou o orientador, não entra em duas bancas à mesma hora.'],
  ['Carga repartida', 'Quem tem menos bancas pontua mais na sugestão da mesa.'],
  ['Currículo contra tema', 'A afinidade compara o tema com as especialidades e o currículo de cada docente.'],
  ['Tudo no mesmo sítio', 'O estudante vê data, local, mesa e a justificação; todos recebem email.'],
]

export function Contraste() {
  const [depois, setDepois] = useState(false)
  const l = depois ? COM : HOJE
  return (
    <div>
      <div className="inline-flex border-2 border-brand-900 p-0.5 bg-white" role="tablist">
        {[['Como costuma ser', false], ['Com o JúriSmart', true]].map(([t, v]) => (
          <button key={String(t)} role="tab" aria-selected={depois === v} onClick={() => setDepois(v as boolean)}
            className={`px-5 py-2 text-sm font-semibold transition ${depois === v ? 'bg-brand-900 text-white' : 'text-brand-900 hover:bg-paper-100'}`}>{t as string}</button>
        ))}
      </div>
      <div key={String(depois)} className="grid sm:grid-cols-2 gap-4 mt-6">
        {l.map(([t, d], i) => (
          <div key={t} className={`p-5 border bg-white rev on ${depois ? 'border-emerald-300' : 'border-slate-200'}`} style={{ animation: `none`, transitionDelay: `${i * 60}ms` }}>
            <p className="text-xs font-bold text-slate-400 mb-2">{depois ? <i className="fa-solid fa-check text-emerald-600" /> : <i className="fa-solid fa-xmark text-rose-500" />}</p>
            <h4 className="font-display text-lg font-bold text-brand-900 leading-snug">{t}</h4>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{d}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Passo a passo ---------- */
const PASSOS = [
  ['Registo', 'Estudante ou Júri', 'Escolhe o perfil e preenche os dados. Quem é Júri indica a formação e as especialidades. Recebe um email para confirmar o endereço.'],
  ['Aprovação', 'Administrador', 'As contas novas ficam pendentes. O administrador aprova ou rejeita em Utilizadores; até lá, a pessoa só vê o aviso de espera.'],
  ['Currículo', 'Júri', 'Junta formação, publicações, projectos, orientações, conferências, livros, citações e prémios. É isto que o sistema compara com o tema.'],
  ['Datas abertas', 'Administrador', 'Abre os dias e os horários em que há defesas, com a duração de cada uma. Só nesses dias se pode marcar uma banca.'],
  ['Agendamento', 'Administrador', 'Escolhe o estudante, o orientador e o tema, depois um dos dias abertos e uma hora livre, e indica o local. Pede a mesa à pontuação automática ou compõe-na à mão, com pesquisa de docentes.'],
  ['Justificação', 'Sistema', 'Cada júri fica com um texto: afinidade com o tema, especialidades, carga e compatibilidade. O administrador pode editá-lo antes de confirmar.'],
  ['Avisos', 'Sistema', 'Estudante, orientador e júris recebem um email com a data, o local e o papel de cada um.'],
  ['Defesa', 'Administrador', 'Imprime a ficha, com espaço para as assinaturas. Depois da defesa, marca a banca como examinada e todos voltam a ser avisados.'],
]

export function Passos() {
  const [i, setI] = useState(0)
  const [titulo, quem, texto] = PASSOS[i]
  return (
    <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-6">
      <ol className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 -mx-1 px-1">
        {PASSOS.map(([t], n) => (
          <li key={t} className="shrink-0">
            <button onClick={() => setI(n)} aria-current={i === n}
              className={`w-full flex items-center gap-3 px-4 py-3 border text-left transition ${i === n ? 'bg-brand-900 text-white border-brand-900 lg:translate-x-2' : 'bg-white border-slate-200 text-slate-700 hover:border-brand-600'}`}>
              <span className={`w-7 h-7 shrink-0 rounded-full text-xs font-bold flex items-center justify-center ${i === n ? 'bg-amber-400 text-brand-900' : 'bg-paper-100 text-brand-900'}`}>{n + 1}</span>
              <span className="font-semibold text-sm whitespace-nowrap">{t}</span>
            </button>
          </li>
        ))}
      </ol>
      <div key={i} className="bg-white border border-paper-300 p-7 flex flex-col justify-center min-h-[15rem] rev on">
        <span className="self-start text-xs font-semibold bg-paper-100 text-brand-900 border border-paper-300 px-2.5 py-1">Quem faz: {quem}</span>
        <h4 className="font-display text-3xl font-bold text-brand-900 mt-4">{i + 1}. {titulo}</h4>
        <Barra valor={i + 1} max={PASSOS.length} cor="bg-amber-400" altura="h-1.5" className="mt-4" rotulo={`Passo ${i + 1} de ${PASSOS.length}`} />
        <p className="text-slate-700 mt-3 leading-relaxed">{texto}</p>
        <div className="mt-6 flex gap-2">
          <button onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0} className="h-9 px-4 text-sm font-semibold border border-slate-300 hover:border-brand-600 disabled:opacity-40">Anterior</button>
          <button onClick={() => setI(Math.min(PASSOS.length - 1, i + 1))} disabled={i === PASSOS.length - 1} className="h-9 px-4 text-sm font-semibold bg-brand-900 text-white hover:bg-brand-800 disabled:opacity-40">Seguinte</button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Perfis ---------- */
const PERFIS = [
  { id: 'adm', nome: 'Administrador', quem: 'Secretário',
    menu: ['Visão Geral', 'Agendar Júri (IA)', 'Datas de Defesa', 'Docentes & Currículos', 'Novo Docente', 'Bancas Agendadas', 'Utilizadores', 'Minha Conta', 'Sobre o Projeto'],
    faz: ['Aprova, desativa e exclui contas, e promove outros administradores.', 'Agenda, edita e exclui bancas, com local, data e mesa.', 'Marca a banca como examinada e dispara os avisos.', 'Regista e gere os docentes e os seus currículos.'],
    nao: ['Não pode alterar nem excluir a própria conta de administrador.'] },
  { id: 'juri', nome: 'Júri', quem: 'Docente ou Investigador',
    menu: ['O Meu Painel', 'O Meu Currículo', 'As Minhas Defesas', 'Minha Conta', 'Sobre o Projeto'],
    faz: ['Mantém o currículo e as especialidades que o sistema usa para o escolher.', 'Vê as defesas em que participa, com o papel de cada uma: presidente, vogal, suplente ou orientador.', 'Recebe um email quando é escolhido para uma banca.'],
    nao: ['Não vê as defesas de outros júris nem a lista de docentes.'] },
  { id: 'est', nome: 'Avaliador', quem: 'Estudante',
    menu: ['A Minha Banca', 'Minha Conta', 'Sobre o Projeto'],
    faz: ['Vê o seu tema, a data, o local e a mesa, com a justificação da escolha de cada júri.', 'Pode pôr uma foto no perfil.', 'Recebe um email quando a banca é marcada e quando é examinada.'],
    nao: ['Não vê as bancas de outros estudantes.'] },
]

export function Perfis() {
  const [id, setId] = useState('adm')
  const p = PERFIS.find(x => x.id === id)!
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist">
        {PERFIS.map(x => (
          <button key={x.id} role="tab" aria-selected={id === x.id} onClick={() => setId(x.id)}
            className={`px-5 py-2.5 text-sm font-semibold border-2 transition ${id === x.id ? 'bg-brand-900 text-white border-brand-900' : 'bg-white text-brand-900 border-brand-900/25 hover:border-brand-900'}`}>
            {x.nome} <span className="font-normal opacity-70">({x.quem})</span>
          </button>
        ))}
      </div>
      <div key={id} className="grid md:grid-cols-[15rem_minmax(0,1fr)] gap-5 mt-5 rev on">
        <div className="bg-slate-900 text-slate-300 p-4">
          <p className="text-xs text-slate-400 mb-2">Menu que vê</p>
          <ul className="space-y-1">
            {p.menu.map((m, n) => <li key={m} className={`text-sm px-3 py-2 ${n === 0 ? 'bg-brand-600 text-white' : 'text-slate-400'}`}>{m}</li>)}
          </ul>
        </div>
        <div className="bg-white border border-paper-300 p-6">
          <p className="text-sm font-semibold text-slate-800 mb-2">O que faz</p>
          <ul className="space-y-2">
            {p.faz.map(f => <li key={f} className="flex gap-2.5 text-sm text-slate-700"><i className="fa-solid fa-check text-emerald-600 mt-1 text-xs" /><span>{f}</span></li>)}
          </ul>
          <p className="text-sm font-semibold text-slate-800 mt-5 mb-2">O que não vê</p>
          <ul className="space-y-2">
            {p.nao.map(f => <li key={f} className="flex gap-2.5 text-sm text-slate-500"><i className="fa-solid fa-minus mt-1 text-xs" /><span>{f}</span></li>)}
          </ul>
        </div>
      </div>
    </div>
  )
}

/* ---------- Perguntas ---------- */
const PERGUNTAS = [
  ['Porque é que a minha conta fica à espera de aprovação?', 'Para que só tenham acesso pessoas conhecidas da instituição. Enquanto o administrador não aprovar, a conta só mostra um aviso de espera, e a página atualiza-se sozinha quando for aprovada.'],
  ['Posso marcar uma defesa em qualquer dia?', 'Não. A secretaria abre os dias e os horários; ao agendar, só aparecem esses dias, e só as horas que ainda estão livres. Se não houver dias abertos, não se consegue marcar.'],
  ['Posso registar-me como administrador?', 'Não. O registo só oferece Júri e Estudante. Um administrador existente promove outra pessoa, depois de a aprovar.'],
  ['A IA decide sozinha quem fica na mesa?', 'Não. Há uma pontuação que sugere a mesa e escreve a justificação, mas é o administrador que confirma, e pode trocar qualquer docente ou editar o texto.'],
  ['Que dados são guardados?', 'Nome, email, telefone (opcional), foto (opcional) e, para os júris, o currículo. As palavras-passe ficam no serviço de autenticação, cifradas, e a aplicação nunca as lê.'],
  ['Porque não posso mudar o meu email?', 'É para onde vão os avisos das bancas e a recuperação da palavra-passe. Manter fixo evita que os avisos se percam.'],
  ['O que acontece quando uma banca é marcada?', 'O estudante, o orientador e os júris escolhidos recebem um email com a data, o local e o papel de cada um. O mesmo acontece quando a banca é alterada ou examinada.'],
]

export function Perguntas() {
  const [aberta, setAberta] = useState<number | null>(0)
  return (
    <ul className="divide-y divide-paper-300 border-y border-paper-300 bg-white">
      {PERGUNTAS.map(([q, a], i) => (
        <li key={q}>
          <button onClick={() => setAberta(aberta === i ? null : i)} aria-expanded={aberta === i}
            className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 hover:bg-paper-50 transition">
            <span className="font-semibold text-brand-900">{q}</span>
            <i className={`fa-solid fa-plus text-brand-600 text-sm transition-transform duration-300 ${aberta === i ? 'rotate-45' : ''}`} />
          </button>
          <div className={`grid transition-all duration-300 ${aberta === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden"><p className="px-5 pb-5 text-sm text-slate-600 leading-relaxed max-w-2xl">{a}</p></div>
          </div>
        </li>
      ))}
    </ul>
  )
}
