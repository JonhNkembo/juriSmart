import { Fragment } from 'react'

const Seccao = ({ icone, titulo, children }: { icone: string; titulo: string; children: React.ReactNode }) => (
  <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
    <h3 className="bg-brand-900 text-white text-sm font-bold px-6 py-3 border-b-4 border-amber-400"><i className={`fa-solid ${icone} mr-2`} />{titulo}</h3>
    <div className="p-6 text-sm text-slate-700 leading-relaxed space-y-3">{children}</div>
  </section>
)

const Lista = ({ itens }: { itens: string[] }) => (
  <ul className="space-y-1.5">
    {itens.map(i => <li key={i} className="flex gap-2"><i className="fa-solid fa-circle-check text-emerald-500 mt-1 text-xs" /><span>{i}</span></li>)}
  </ul>
)

const passos = [
  ['Registo', 'A pessoa cria conta como Júri (docente ou investigador) ou Avaliador (estudante) e confirma o email.'],
  ['Aprovação', 'A conta fica pendente até o administrador a aprovar. Só então tem acesso ao sistema.'],
  ['Currículos', 'Os júris completam o currículo e as especialidades; o administrador pode registar docentes.'],
  ['Datas abertas', 'O administrador abre os dias e os horários das defesas. Só nesses dias se pode marcar uma banca.'],
  ['Agendamento', 'O administrador indica o estudante, o tema e o orientador, escolhe um dia aberto e uma hora livre, e indica o local. A mesa é proposta pela IA ou composta à mão.'],
  ['Justificação', 'Cada júri fica com um texto que explica porque foi escolhido. O administrador pode editá-lo antes de confirmar.'],
  ['Avisos', 'Estudante, orientador e júris recebem um email com a data, a mesa e o papel de cada um.'],
  ['Defesa', 'A ficha da banca pode ser impressa. Depois da defesa, o administrador marca-a como examinada e todos são avisados.'],
]

export default function SobreConteudo() {
  return (
    <Fragment>
      <Seccao icone="fa-triangle-exclamation" titulo="O problema">
        <p>Marcar a defesa de um TCC parece simples, mas envolve várias pessoas ao mesmo tempo: o estudante, o orientador e três ou quatro docentes que têm de estar livres à mesma hora. Quando isto é feito por mensagens e folhas soltas, é comum:</p>
        <Lista itens={[
          'marcar o mesmo docente em duas defesas à mesma hora;',
          'sobrecarregar sempre os mesmos docentes, enquanto outros quase não participam;',
          'escolher júris sem relação com o tema do trabalho;',
          'o estudante não saber porque aquelas pessoas foram escolhidas, nem acompanhar o estado da sua defesa.',
        ]} />
      </Seccao>

      <Seccao icone="fa-bullseye" titulo="O que o sistema faz hoje">
        <Lista itens={[
          'Datas abertas pela secretaria: só se marca em dias abertos, em horas ainda livres, com barra de ocupação por dia.',
          'Agendamento automático (pontuação) ou manual da mesa: presidente, 1.º vogal, 2.º vogal e suplente, com pesquisa de docentes e de estudantes.',
          'Verificação de conflitos: um docente, ou o orientador, não pode estar em duas bancas à mesma hora.',
          'Justificação escrita da escolha de cada júri, visível ao estudante.',
          'Currículo de cada docente por secções (formação, publicações, projectos, orientações, conferências, livros, citações e prémios).',
          'Aviso por email ao estudante, ao orientador e aos júris quando a banca é marcada, alterada ou examinada.',
          'Local, data e hora da defesa, visíveis ao estudante, ao orientador e aos júris, e incluídos nos emails e na ficha.',
          'Ficha da banca pronta a imprimir ou guardar em PDF, com espaço para assinaturas.',
          'Aprovação de contas novas pelo administrador, que também promove, desativa e exclui utilizadores.',
          'Recuperação de palavra-passe por email e foto de perfil.',
        ]} />
      </Seccao>

      <Seccao icone="fa-route" titulo="Como decorre uma defesa no sistema">
        <ol className="space-y-3">
          {passos.map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="w-7 h-7 shrink-0 rounded-full bg-brand-900 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
              <span><b className="text-slate-900">{t}.</b> {d}</span>
            </li>
          ))}
        </ol>
      </Seccao>

      <Seccao icone="fa-microchip" titulo="Como a mesa é escolhida">
        <p>A sugestão automática <b>não é um modelo de linguagem</b>: é uma pontuação de 0 a 100, simples e verificável, calculada para cada docente disponível:</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            ['60%', 'Afinidade', 'Palavras do tema e das palavras-chave que aparecem nas especialidades e nos títulos do currículo do docente.'],
            ['20%', 'Nível académico', 'Doutorado pontua mais do que Mestrado, e este mais do que Licenciatura.'],
            ['20%', 'Equilíbrio', 'Quem tem menos bancas atribuídas pontua mais, para repartir o trabalho.'],
          ].map(([p, t, d]) => (
            <div key={t} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-2xl font-extrabold text-brand-700">{p}</p>
              <p className="font-bold text-slate-900">{t}</p>
              <p className="text-xs text-slate-600 mt-1">{d}</p>
            </div>
          ))}
        </div>
        <p>São excluídos o orientador, os docentes marcados como indisponíveis e os que já têm banca à mesma hora. Ficam os quatro melhores; o presidente é quem tem o nível académico mais alto entre eles. A justificação de cada um é gerada a partir destes mesmos dados, e o administrador pode sempre alterar a mesa e o texto.</p>
      </Seccao>

      <Seccao icone="fa-users-gear" titulo="Quem usa e o que pode fazer">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            ['fa-user-shield', 'Administrador (Secretário)', 'Aprova contas, agenda, edita e exclui bancas, marca-as como examinadas, gere docentes e utilizadores.'],
            ['fa-scale-balanced', 'Júri (Docente ou Investigador)', 'Mantém o seu currículo e vê apenas as defesas em que participa, com o seu papel. Recebe email quando é escolhido.'],
            ['fa-user-graduate', 'Avaliador (Estudante)', 'Vê apenas a sua banca: data, mesa e justificação das escolhas. Recebe email quando a banca é marcada e examinada.'],
          ].map(([ic, t, d]) => (
            <div key={t} className="rounded-xl border border-slate-200 p-4">
              <i className={`fa-solid ${ic} text-brand-600 text-lg`} />
              <p className="font-bold text-slate-900 mt-2">{t}</p>
              <p className="text-xs text-slate-600 mt-1">{d}</p>
            </div>
          ))}
        </div>
      </Seccao>

      <Seccao icone="fa-layer-group" titulo="Tecnologia">
        <Lista itens={[
          'Interface: Next.js (React) com Tailwind CSS.',
          'Base de dados, autenticação e ficheiros: Supabase (PostgreSQL, Auth e Storage).',
          'Emails de conta (confirmação e recuperação): enviados pelo Supabase Auth, com modelos próprios.',
          'Emails de bancas: enviados pelo servidor da aplicação por SMTP (Nodemailer).',
          'Impressão: ficha em formato A4, gerada no navegador (imprimir ou guardar como PDF).',
        ]} />
      </Seccao>

      <Seccao icone="fa-shield-halved" titulo="Segurança e privacidade">
        <Lista itens={[
          'As regras de acesso estão na base de dados (Row Level Security), e não só no ecrã: cada perfil só consegue ler o que lhe diz respeito.',
          'Contas novas ficam bloqueadas até aprovação, e podem ser desativadas a qualquer momento.',
          'As palavras-passe nunca são guardadas pela aplicação: ficam no Supabase Auth, cifradas.',
          'A foto de cada pessoa fica numa pasta própria, que só ela consegue alterar.',
          'O email de cada conta não pode ser alterado, para os avisos chegarem sempre ao destino certo.',
        ]} />
      </Seccao>

      <Seccao icone="fa-circle-exclamation" titulo="Limitações actuais">
        <Lista itens={[
          'A disponibilidade é por marcação: o sistema evita sobrepor bancas à mesma hora, mas ainda não tem um calendário de horários livres de cada docente.',
          'O local é um texto livre (por exemplo, "Sala 12, Bloco B"): ainda não há gestão de salas nem verificação de ocupação.',
          'A defesa é apenas marcada como examinada: notas e resultado não são registados.',
          'Os emails de bancas só funcionam depois de configurar o servidor SMTP.',
          'A afinidade compara palavras, não significado: temas escritos com termos diferentes dos do currículo pontuam menos.',
        ]} />
      </Seccao>

      <Seccao icone="fa-road" titulo="Próximos passos">
        <Lista itens={[
          'Agente de IA (modelo de linguagem) que lê os currículos e propõe a mesa em linguagem natural, sempre com confirmação do administrador.',
          'Calendário de disponibilidade e gestão de salas.',
          'Registo de notas e emissão da ata da defesa.',
          'Notificações dentro do sistema, além do email.',
        ]} />
      </Seccao>

    </Fragment>
  )
}
