import type { Docente } from './types'

export const PAPEIS = ['presidente', 'vogal1', 'vogal2', 'suplente'] as const
export const ROTULOS = ['Presidente', '1º Vogal (Avaliador)', '2º Vogal (Avaliador)', 'Suplente']
export const PAPEL_CURTO: Record<string, string> = { presidente: 'Presidente', vogal1: '1º Vogal', vogal2: '2º Vogal', suplente: 'Suplente' }

const NIVEL = { Doutorado: 3, Mestrado: 2, Licenciatura: 1 } as const
const STOP = new Set(['para', 'com', 'uma', 'uns', 'das', 'dos', 'nas', 'nos', 'por', 'sobre', 'como'])
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const tokens = (s: string) => norm(s).split(/[^a-z0-9]+/).filter(t => t.length > 2 && !STOP.has(t))
const perfilDe = (d: Docente) => new Set(tokens([...d.especialidades, ...d.curriculo_itens.map(i => i.titulo)].join(' ')))

export type Entrada = { tema: string; palavras: string }
export type Match = { docente: Docente; score: number; motivo: string }

/** Pontuação 0-100: 60% afinidade (tema/palavras vs. especialidades e currículo),
 *  20% nível académico, 20% equilíbrio de carga (menos bancas = melhor). */
export function pontuar(input: Entrada, d: Docente, cargas: Record<string, number>): number {
  const q = new Set(tokens(`${input.tema} ${input.palavras}`))
  const maxCarga = Math.max(1, ...Object.values(cargas))
  const perfil = perfilDe(d)
  let hits = 0
  q.forEach(t => { if (perfil.has(t)) hits++ })
  const relev = Math.min(1, hits / Math.max(1, Math.min(q.size, 4)))
  return Math.round(60 * relev + 20 * (NIVEL[d.nivel] / 3) + 20 * (1 - (cargas[d.id] ?? 0) / maxCarga))
}

export function rankDocentes(
  input: Entrada & { orientador: string },
  docs: Docente[], cargas: Record<string, number>, ocupados: Set<string>
): Match[] {
  return docs
    .filter(d => d.disponivel && d.id !== input.orientador && !ocupados.has(d.id))
    .map(d => {
      const score = pontuar(input, d, cargas)
      return { docente: d, score, motivo: justificar(input, d, cargas[d.id] ?? 0, score) }
    })
    .sort((a, b) => b.score - a.score)
}

/** Top 4: presidente = maior nível académico entre eles; restantes por pontuação.
 *  Acrescenta à justificação a frase do lugar que cada um ocupa na mesa. */
export function assignSlots(r: Match[]): (Match | null)[] {
  const top = r.slice(0, 4)
  const pres = [...top].sort((a, b) => NIVEL[b.docente.nivel] - NIVEL[a.docente.nivel] || b.score - a.score)[0]
  const resto = top.filter(m => m !== pres)
  const lugar = (m: Match | undefined, i: number): Match | null => {
    if (!m) return null
    const n = m.docente.nivel
    const frase = i === 0 ? `Preside à mesa por ter o nível académico mais elevado entre os membros (${n}).`
      : i === 3 ? `Suplente (${n}): substitui qualquer membro em caso de ausência.`
      : `Vogal avaliador (${n}).`
    return { ...m, motivo: `${m.motivo} ${frase}` }
  }
  return [lugar(pres, 0), lugar(resto[0], 1), lugar(resto[1], 2), lugar(resto[2], 3)]
}

/** Palavras do tema/palavras-chave que aparecem no perfil do docente (com a grafia original). */
function termosEmComum(input: Entrada, d: Docente): string[] {
  const perfil = perfilDe(d)
  const vistos = new Set<string>()
  const out: string[] = []
  const texto = `${input.tema} ${input.palavras}`
  texto.split(/[^a-zA-Z0-9\u00C0-\u024F]+/).filter(Boolean).forEach(w => {
    const t = norm(w)
    if (t.length > 2 && !STOP.has(t) && perfil.has(t) && !vistos.has(t)) { vistos.add(t); out.push(w.toLowerCase()) }
  })
  return out.slice(0, 6)
}

/** Texto que o estudante lê para perceber porque é que cada docente está na sua banca
 *  (sem o lugar na mesa, que é acrescentado depois). */
export function justificar(input: Entrada, d: Docente, carga: number, score: number): string {
  const termos = termosEmComum(input, d)
  const p: string[] = []
  p.push(termos.length
    ? `Afinidade com o tema do TCC (${termos.join(', ')}).`
    : 'Sem coincidência directa de palavras com o tema; considerado pelo perfil académico e pela disponibilidade.')
  if (d.especialidades.length) p.push(`Especialidades: ${d.especialidades.join(', ')}.`)
  p.push(`Bancas já atribuídas: ${carga}. Compatibilidade global: ${score}%.`)
  return p.join(' ')
}
