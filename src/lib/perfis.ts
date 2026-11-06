export type PerfilTipo = 'administrador' | 'juri' | 'avaliador'
export type Perfil = {
  id: string; nome: string; email: string; telefone: string | null
  perfil: PerfilTipo; docente_id: string | null
}
export type Acao =
  | 'ver_painel' | 'agendar' | 'cancelar' | 'ver_bancas' | 'imprimir' | 'ver_docentes'
  | 'gerir_docentes' | 'editar_curriculo_proprio' | 'gerir_utilizadores' | 'editar_conta'

export const ROTULO_ACAO: Record<Acao, string> = {
  ver_painel: 'Ver o painel e as estatísticas',
  agendar: 'Agendar júris (automático e manual)',
  cancelar: 'Cancelar júris agendados',
  ver_bancas: 'Ver bancas agendadas',
  imprimir: 'Imprimir a mesa agendada',
  ver_docentes: 'Consultar docentes e currículos',
  gerir_docentes: 'Registar e gerir todos os docentes',
  editar_curriculo_proprio: 'Editar o próprio currículo e disponibilidade',
  gerir_utilizadores: 'Gerir utilizadores e perfis',
  editar_conta: 'Alterar os dados da própria conta',
}

export const PERFIS: Record<PerfilTipo, { rotulo: string; detalhe: string; icone: string; notas: string[] }> = {
  administrador: {
    rotulo: 'Administrador', detalhe: 'Secretário', icone: 'fa-user-shield',
    notas: ['Acesso total ao sistema.'],
  },
  juri: {
    rotulo: 'Júri', detalhe: 'Docente ou Investigador', icone: 'fa-scale-balanced',
    notas: ['Vê todas as bancas.', 'Só edita o seu próprio currículo.'],
  },
  avaliador: {
    rotulo: 'Avaliador', detalhe: 'Estudante', icone: 'fa-user-graduate',
    notas: ['Vê e imprime apenas a sua própria banca.'],
  },
}

export const PRIVILEGIOS: Record<PerfilTipo, Acao[]> = {
  administrador: ['ver_painel', 'agendar', 'cancelar', 'ver_bancas', 'imprimir', 'ver_docentes', 'gerir_docentes', 'gerir_utilizadores', 'editar_conta'],
  juri: ['ver_painel', 'ver_bancas', 'imprimir', 'ver_docentes', 'editar_curriculo_proprio', 'editar_conta'],
  avaliador: ['ver_bancas', 'imprimir', 'editar_conta'],
}

export const pode = (p: PerfilTipo | undefined, a: Acao) => !!p && PRIVILEGIOS[p].includes(a)

const ROTAS: [string, Acao][] = [
  ['/docentes/novo', 'gerir_docentes'], ['/docentes', 'ver_docentes'],
  ['/agendar', 'agendar'], ['/utilizadores', 'gerir_utilizadores'],
]
export function rotaPermitida(path: string, p: PerfilTipo) {
  if (path === '/') return pode(p, 'ver_painel')
  const r = ROTAS.find(([pre]) => path === pre || path.startsWith(pre + '/'))
  return r ? pode(p, r[1]) : true
}
