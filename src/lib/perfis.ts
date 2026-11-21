export type PerfilTipo = 'administrador' | 'juri' | 'avaliador'
export type Perfil = {
  id: string; nome: string; email: string; telefone: string | null
  perfil: PerfilTipo; docente_id: string | null
  estado: 'pendente' | 'ativo' | 'desativado'
  foto_url: string | null
}
export type Acao =
  | 'ver_painel' | 'ver_painel_pessoal' | 'agendar' | 'gerir_datas' | 'cancelar' | 'ver_bancas' | 'ver_defesas' | 'ver_minha_banca' | 'imprimir'
  | 'ver_docentes' | 'gerir_docentes' | 'editar_curriculo_proprio' | 'gerir_utilizadores' | 'editar_conta'

export const ROTULO_ACAO: Record<Acao, string> = {
  ver_painel: 'Ver o painel e as estatísticas',
  ver_painel_pessoal: 'Painel pessoal: currículo, próximas defesas e estado do perfil',
  agendar: 'Agendar júris (automático e manual) nos dias abertos',
  gerir_datas: 'Abrir e gerir as datas disponíveis para defesas',
  cancelar: 'Editar e excluir júris agendados',
  ver_bancas: 'Ver todas as bancas agendadas',
  ver_defesas: 'Ver as defesas em que participa e o seu papel (presidente, vogal ou suplente)',
  ver_minha_banca: 'Acompanhar a sua banca: mesa, data e justificação da escolha de cada júri',
  imprimir: 'Imprimir a mesa agendada',
  ver_docentes: 'Consultar todos os docentes e currículos',
  gerir_docentes: 'Registar e gerir todos os docentes',
  editar_curriculo_proprio: 'Adicionar e editar o próprio currículo',
  gerir_utilizadores: 'Gerir utilizadores: promover a administrador, desativar e excluir',
  editar_conta: 'Alterar os dados da própria conta',
}

export const PERFIS: Record<PerfilTipo, { rotulo: string; detalhe: string; icone: string; notas: string[] }> = {
  administrador: {
    rotulo: 'Administrador', detalhe: 'Secretário', icone: 'fa-user-shield',
    notas: ['Acesso total ao sistema.', 'É o único que cria outros administradores.'],
  },
  juri: {
    rotulo: 'Júri', detalhe: 'Docente ou Investigador', icone: 'fa-scale-balanced',
    notas: ['Só vê o seu perfil e as defesas em que participa.', 'Recebe um email quando é escolhido para uma banca.'],
  },
  avaliador: {
    rotulo: 'Avaliador', detalhe: 'Estudante', icone: 'fa-user-graduate',
    notas: ['Só vê a sua própria banca.', 'Recebe um email quando a banca é marcada e quando é examinada.'],
  },
}

export const PRIVILEGIOS: Record<PerfilTipo, Acao[]> = {
  administrador: ['ver_painel', 'agendar', 'gerir_datas', 'cancelar', 'ver_bancas', 'imprimir', 'ver_docentes', 'gerir_docentes', 'gerir_utilizadores', 'editar_conta'],
  juri: ['ver_painel_pessoal', 'ver_defesas', 'imprimir', 'editar_curriculo_proprio', 'editar_conta'],
  avaliador: ['ver_minha_banca', 'imprimir', 'editar_conta'],
}

export const pode = (p: PerfilTipo | undefined, a: Acao) => !!p && PRIVILEGIOS[p].includes(a)

const ROTAS: [string, Acao][] = [
  ['/docentes/novo', 'gerir_docentes'], ['/docentes', 'ver_docentes'],
  ['/agendar', 'agendar'], ['/utilizadores', 'gerir_utilizadores'], ['/curriculo', 'editar_curriculo_proprio'], ['/datas', 'gerir_datas'],
]
export function rotaPermitida(path: string, p: PerfilTipo) {
  if (path === '/') return pode(p, 'ver_painel') || pode(p, 'ver_painel_pessoal')
  const r = ROTAS.find(([pre]) => path === pre || path.startsWith(pre + '/'))
  return r ? pode(p, r[1]) : true
}
