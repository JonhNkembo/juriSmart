'use client'
import { useEffect, useState } from 'react'
import Rev from './landing/Rev'
import Ficha from './landing/Ficha'
import Simulador from './landing/Simulador'
import Gaveta, { type Modo } from './landing/Gaveta'
import { Contraste, Passos, Perfis, Perguntas } from './landing/Seccoes'
import Resumo from './landing/Resumo'
import DatasDemo from './landing/DatasDemo'

const NAV = [['#resumo', 'A aplicação'], ['#simulador', 'Escolha da mesa'], ['#datas', 'Datas'], ['#passos', 'Passo a passo'], ['#perfis', 'Perfis'], ['#perguntas', 'Perguntas']]

function Titulo({ children, sub }: { k?: string; children: React.ReactNode; sub?: string }) {
  return (
    <div className="max-w-2xl mb-8">
      <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-900 leading-tight">{children}</h2>
      {sub && <p className="text-slate-600 mt-3 leading-relaxed">{sub}</p>}
    </div>
  )
}

export default function Landing() {
  const [modo, setModo] = useState<Modo | null>(null)
  const [descido, setDescido] = useState(false)
  useEffect(() => {
    const f = () => setDescido(window.scrollY > 8)
    f(); window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])

  return (
    <div id="landing" className="min-h-screen bg-paper-100 text-slate-800">
      <header className={`sticky top-0 z-40 bg-brand-900 text-white transition-shadow ${descido ? 'shadow-lg' : ''}`}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <a href="#topo" className="font-display font-bold text-xl leading-none">JúriSmart <span className="text-amber-300">AI</span></a>
          <nav className="hidden lg:flex items-center gap-6 text-sm text-sky-100">
            {NAV.map(([h, t]) => <a key={h} href={h} className="hover:text-white transition">{t}</a>)}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => setModo('entrar')} className="h-9 px-4 text-sm font-semibold hover:bg-white/10 rounded-md transition">Entrar</button>
            <button onClick={() => setModo('criar')} className="h-9 px-4 text-sm font-bold bg-amber-400 hover:bg-amber-300 text-brand-900 rounded-md transition">Criar conta</button>
          </div>
        </div>
      </header>

      <main id="topo">
        {/* Abertura */}
        <section className="max-w-6xl mx-auto px-5 pt-12 pb-16 sm:pt-16 sm:pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-bold text-brand-900 leading-[1.08]">Cada defesa com a mesa certa, à hora certa.</h1>
            <p className="text-lg text-slate-700 mt-5 max-w-xl leading-relaxed">Marque a banca, escolha os docentes com base no currículo, evite que alguém fique em dois sítios ao mesmo tempo e deixe o estudante saber porque cada júri foi escolhido.</p>
            <div className="flex flex-wrap gap-3 mt-8">
              <button onClick={() => setModo('criar')} className="h-12 px-7 bg-brand-900 hover:bg-brand-800 text-white font-bold rounded-md shadow-md transition">Criar conta</button>
              <button onClick={() => setModo('entrar')} className="h-12 px-7 border-2 border-brand-900 text-brand-900 hover:bg-brand-900 hover:text-white font-bold rounded-md transition">Entrar</button>
              <a href="#simulador" className="h-12 px-3 inline-flex items-center text-sm font-semibold text-brand-900 hover:underline">Ver como a mesa é escolhida</a>
            </div>
            <p className="text-xs text-slate-500 mt-5 max-w-md"><i className="fa-solid fa-circle-info mr-1.5" />As contas novas ficam a aguardar a aprovação do administrador antes do primeiro acesso.</p>
          </div>
          <Rev><Ficha /></Rev>
        </section>

        <section id="resumo" className="bg-white border-y border-paper-200 scroll-mt-16">
          <div className="max-w-6xl mx-auto px-5 py-16">
            <Titulo sub="Seis coisas que o sistema faz, em poucas palavras. Toque num cartão para ver o detalhe.">A aplicação em resumo</Titulo>
            <Resumo />
          </div>
        </section>

        <section id="contraste" className="bg-paper-50 border-y border-paper-200 scroll-mt-16">
          <div className="max-w-6xl mx-auto px-5 py-16">
            <Rev>
              <Titulo k="O problema" sub="Juntar o estudante, o orientador e três ou quatro docentes à mesma hora parece simples, até se fazer por mensagens e folhas soltas.">Marcar uma defesa dá mais trabalho do que parece</Titulo>
              <Contraste />
            </Rev>
          </div>
        </section>

        <section id="simulador" className="scroll-mt-16">
          <div className="max-w-6xl mx-auto px-5 py-16">
            <Rev>
              <Titulo k="Experimente" sub="Escreva um tema e veja quem a pontuação põe na mesa, e porquê. É a mesma lógica do sistema, aplicada a docentes inventados.">Como a mesa é escolhida</Titulo>
              <Simulador />
            </Rev>
          </div>
        </section>

        <section id="datas" className="bg-white border-y border-paper-200 scroll-mt-16">
          <div className="max-w-6xl mx-auto px-5 py-16">
            <Titulo sub="A secretaria abre os dias e os horários das defesas. Ao agendar, só se escolhe entre esses dias, e só aparecem as horas ainda livres.">Só se marca em dias abertos</Titulo>
            <DatasDemo />
          </div>
        </section>

        <section id="passos" className="bg-paper-50 border-y border-paper-200 scroll-mt-16">
          <div className="max-w-6xl mx-auto px-5 py-16">
            <Rev>
              <Titulo k="Passo a passo" sub="Do registo à defesa examinada, cada etapa tem um responsável.">Como decorre uma banca</Titulo>
              <Passos />
            </Rev>
          </div>
        </section>

        <section id="perfis" className="scroll-mt-16">
          <div className="max-w-6xl mx-auto px-5 py-16">
            <Rev>
              <Titulo k="Perfis" sub="Cada pessoa vê apenas o que lhe diz respeito. Isto é garantido na base de dados, e não só no ecrã.">Quem vê o quê</Titulo>
              <Perfis />
            </Rev>
          </div>
        </section>

        <section className="bg-brand-900 text-white">
          <div className="max-w-6xl mx-auto px-5 py-14 grid md:grid-cols-2 gap-10">
            <Rev>
              <h3 className="font-display text-xl font-bold">O que ainda não faz</h3>
              <ul className="mt-4 space-y-3 text-sm text-sky-100 leading-relaxed">
                <li>Não tem calendário de horários livres de cada docente: só evita que alguém esteja em duas bancas à mesma hora.</li>
                <li>Há uma defesa de cada vez em cada horário: não gere salas em paralelo.</li>
                <li>O local é um texto livre, sem gestão de salas.</li>
                <li>Não regista notas: a banca é apenas marcada como examinada.</li>
                <li>A afinidade compara palavras, não significado.</li>
              </ul>
            </Rev>
            <Rev atraso={100}>
              <h3 className="font-display text-xl font-bold">O que vem a seguir</h3>
              <ul className="mt-4 space-y-3 text-sm text-sky-100 leading-relaxed">
                <li>Um agente de IA que leia os currículos e proponha a mesa em linguagem natural, sempre com confirmação do administrador.</li>
                <li>Calendário de disponibilidade e salas.</li>
                <li>Registo de notas e ata da defesa.</li>
              </ul>
            </Rev>
          </div>
        </section>

        <section id="perguntas" className="scroll-mt-16">
          <div className="max-w-3xl mx-auto px-5 py-16">
            <Rev>
              <Titulo k="Perguntas">O que costuma perguntar-se</Titulo>
              <Perguntas />
            </Rev>
          </div>
        </section>
      </main>

      <footer className="bg-brand-900 text-white">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-display font-bold text-lg">JúriSmart <span className="text-amber-300">AI</span> <span className="font-sans font-normal text-sm text-sky-200 ml-2">Agendamento de júris de TCC</span></p>
          <div className="flex gap-2">
            <button onClick={() => setModo('entrar')} className="h-9 px-4 text-sm font-semibold border border-white/40 hover:bg-white/10 rounded-md transition">Entrar</button>
            <button onClick={() => setModo('criar')} className="h-9 px-4 text-sm font-bold bg-amber-400 hover:bg-amber-300 text-brand-900 rounded-md transition">Criar conta</button>
          </div>
        </div>
      </footer>

      <Gaveta modo={modo} aoFechar={() => setModo(null)} aoTrocar={setModo} />
    </div>
  )
}
