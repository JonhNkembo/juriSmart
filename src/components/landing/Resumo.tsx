'use client'
import { useState } from 'react'

const CARTOES = [
  ['fa-people-group', 'Mesa de quatro lugares', 'Presidente, dois vogais e suplente, escolhidos pela afinidade com o tema.',
    'A sugestão automática pontua cada docente por afinidade com o tema, nível académico e carga de bancas. O administrador pode trocar qualquer lugar à mão.'],
  ['fa-calendar-check', 'Só em dias abertos', 'A secretaria abre as datas e os horários; ninguém marca fora deles.',
    'Cada dia aberto tem hora de início e de fim, a duração de cada defesa e, se quiser, um local. As horas já ocupadas deixam de aparecer.'],
  ['fa-file-lines', 'Justificação escrita', 'Cada júri tem um texto que explica porque foi escolhido.',
    'O estudante lê esse texto no seu perfil. O administrador pode editá-lo antes de confirmar a banca.'],
  ['fa-envelope', 'Avisos por email', 'Estudante, orientador e júris recebem a data, o local e o papel de cada um.',
    'Há aviso quando a banca é marcada, quando é alterada e quando é examinada. Depende de o servidor de email estar configurado.'],
  ['fa-print', 'Ficha para imprimir', 'Folha A4 com tema, data, local, mesa e espaço para as assinaturas.',
    'Pode imprimir-se ou guardar-se em PDF a partir do navegador, na própria banca ou ao confirmar o agendamento.'],
  ['fa-user-check', 'Contas aprovadas', 'Quem se regista espera pela aprovação do administrador antes de entrar.',
    'O administrador aprova, desativa ou exclui contas. Contas desativadas veem apenas um aviso de indisponibilidade.'],
]

export default function Resumo() {
  const [aberto, setAberto] = useState<number | null>(null)
  return (
    <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {CARTOES.map(([icone, titulo, texto, detalhe], i) => (
        <li key={titulo} className="self-start">
          <button onClick={() => setAberto(aberto === i ? null : i)} aria-expanded={aberto === i}
            className={`w-full text-left bg-paper-50 border p-5 ${aberto === i ? 'border-brand-900' : 'border-paper-300'}`}>
            <span className="flex items-start gap-4">
              <span className="w-10 h-10 shrink-0 bg-brand-900 text-white flex items-center justify-center rounded-sm"><i className={`fa-solid ${icone}`} /></span>
              <span className="min-w-0">
                <span className="block font-semibold text-brand-900">{titulo}</span>
                <span className="block text-sm text-slate-600 mt-1 leading-relaxed">{texto}</span>
              </span>
            </span>
            {aberto === i && <span className="block text-sm text-slate-700 leading-relaxed mt-4 pt-4 border-t border-paper-300">{detalhe}</span>}
          </button>
        </li>
      ))}
    </ul>
  )
}
