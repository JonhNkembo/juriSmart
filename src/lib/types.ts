export type Item = { id: string; categoria: string; titulo: string; ano: number | null }
export type Nivel = 'Doutorado' | 'Mestrado' | 'Licenciatura'
export type Docente = {
  id: string; nome: string; email: string; grau: string; nivel: Nivel
  especialidades: string[]; disponivel: boolean; curriculo_itens: Item[]
}
export const CATEGORIAS = [
  { key: 'formacao', label: 'Formação Académica', icon: 'fa-book-open' },
  { key: 'publicacoes', label: 'Publicações Científicas', icon: 'fa-newspaper' },
  { key: 'projectos', label: 'Projectos de Investigação', icon: 'fa-diagram-project' },
  { key: 'orientacoes', label: 'Orientações de Trabalhos', icon: 'fa-users' },
  { key: 'conferencias', label: 'Conferências & Eventos', icon: 'fa-chalkboard-user' },
  { key: 'livros', label: 'Livros & Capítulos', icon: 'fa-book' },
  { key: 'citacoes', label: 'Citações', icon: 'fa-quote-right' },
  { key: 'premios', label: 'Prémios & Distinções', icon: 'fa-trophy' },
]
