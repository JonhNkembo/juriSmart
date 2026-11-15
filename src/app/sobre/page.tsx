import Link from 'next/link'
import SobreConteudo from '@/components/SobreConteudo'

export default function Sobre() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="rounded-lg overflow-hidden shadow-md border border-slate-200">
        <div className="bg-gradient-to-br from-brand-900 to-brand-700 text-white px-8 py-8 border-b-4 border-amber-400">
          <p className="text-xs uppercase tracking-widest text-sky-200">Sobre o projeto</p>
          <h2 className="text-3xl font-extrabold mt-1">JúriSmart <span className="text-cyan-300">AI</span></h2>
          <p className="mt-2 text-sky-100 max-w-2xl">Sistema web para organizar as defesas de Trabalhos de Conclusão de Curso (TCC): escolhe a mesa examinadora, evita conflitos de horário, explica cada escolha e avisa todos os envolvidos.</p>
        </div>
        <div className="bg-white px-8 py-4 flex flex-wrap gap-x-8 gap-y-2 text-xs text-slate-500">
          <span><i className="fa-solid fa-flask text-brand-600 mr-1.5" />Estado: protótipo funcional</span>
          <span><i className="fa-solid fa-users text-brand-600 mr-1.5" />3 perfis: Administrador, Júri, Avaliador</span>
          <span><i className="fa-solid fa-database text-brand-600 mr-1.5" />Next.js + Supabase</span>
        </div>
      </header>

      <SobreConteudo />

      <p className="text-center text-xs text-slate-400 pb-2">
        Dúvidas sobre o funcionamento? Fale com o administrador do sistema. <Link href="/conta" className="text-brand-700 hover:underline">Ir para a minha conta</Link>
      </p>
    </div>
  )
}
