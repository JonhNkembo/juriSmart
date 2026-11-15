'use client'
import Link from 'next/link'
import SobreConteudo from './SobreConteudo'

const Botoes = ({ grande = false }: { grande?: boolean }) => (
  <div className="flex flex-wrap gap-3 justify-center">
    <Link href="/cadastro" className={`${grande ? 'h-12 px-8 text-base' : 'h-10 px-5 text-sm'} inline-flex items-center rounded-md bg-amber-400 hover:bg-amber-300 text-brand-900 font-bold shadow-md transition`}>
      <i className="fa-solid fa-user-plus mr-2" />Criar conta
    </Link>
    <Link href="/login" className={`${grande ? 'h-12 px-8 text-base' : 'h-10 px-5 text-sm'} inline-flex items-center rounded-md border-2 border-white/80 text-white hover:bg-white/10 font-bold transition`}>
      <i className="fa-solid fa-right-to-bracket mr-2" />Entrar
    </Link>
  </div>
)

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 overflow-y-auto h-screen">
      <header className="bg-brand-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2.5 rounded-xl shadow-lg"><i className="fa-solid fa-graduation-cap text-xl" /></div>
            <div>
              <h1 className="font-bold text-lg leading-none">JúriSmart <span className="text-cyan-400 font-extrabold">AI</span></h1>
              <span className="text-xs text-sky-200">Agendamento de TCC</span>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/login" className="h-9 px-4 inline-flex items-center rounded-md text-sm font-semibold text-white hover:bg-white/10">Entrar</Link>
            <Link href="/cadastro" className="h-9 px-4 inline-flex items-center rounded-md text-sm font-bold bg-amber-400 hover:bg-amber-300 text-brand-900">Criar conta</Link>
          </nav>
        </div>
        <div className="bg-gradient-to-br from-brand-900 to-brand-700 border-b-4 border-amber-400">
          <div className="max-w-5xl mx-auto px-6 py-16 text-center">
            <p className="text-xs uppercase tracking-widest text-sky-200">Defesas de TCC sem confusão</p>
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight mt-3 max-w-3xl mx-auto">Júris de TCC organizados com inteligência</h2>
            <p className="mt-4 text-sky-100 max-w-2xl mx-auto">Escolhe a mesa examinadora, evita conflitos de horário, explica cada escolha ao estudante e avisa todos por email.</p>
            <div className="mt-8"><Botoes grande /></div>
            <p className="mt-4 text-xs text-sky-200"><i className="fa-solid fa-circle-info mr-1.5" />As contas novas são aprovadas pelo administrador antes do primeiro acesso.</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <SobreConteudo />
        <section className="rounded-lg bg-gradient-to-br from-brand-900 to-brand-700 text-white text-center px-6 py-10 border-b-4 border-amber-400">
          <h3 className="text-2xl font-extrabold">Pronto para começar?</h3>
          <p className="text-sky-100 text-sm mt-2">Entre na sua conta ou registe-se como Júri (docente ou investigador) ou Avaliador (estudante).</p>
          <div className="mt-6"><Botoes grande /></div>
        </section>
      </main>

      <footer className="text-center text-xs text-slate-400 pb-8">JúriSmart AI · Sistema de agendamento de júris de TCC</footer>
    </div>
  )
}
