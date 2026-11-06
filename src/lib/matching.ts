import type { Docente } from './types'

export const PAPEIS = ['presidente', 'vogal1', 'vogal2', 'suplente'] as const
export const ROTULOS = ['Presidente', '1º Vogal (Avaliador)', '2º Vogal (Avaliador)', 'Suplente']
const NIVEL = { Doutorado: 3, Mestrado: 2, Licenciatura: 1 } as const
const STOP = new Set(['para', 'com', 'uma', 'uns', 'das', 'dos', 'nas', 'nos', 'por', 'sobre', 'como'])
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const tokens = (s: string) => norm(s).split(/[^a-z0-9]+/).filter(t => t.length > 2 && !STOP.has(t))

export type Match = { docente: Docente; score: number }

/** Pontuação 0-100: 60% afinidade (tema/palavras vs. especialidades e currículo),
 *  20% nível académico, 20% equilíbrio de carga (menos bancas = melhor). */
export function rankDocentes(
  input: { tema: string; palavras: string; orientador: string },
  docs: Docente[], cargas: Record<string, number>, ocupados: Set<string>
): Match[] {
  const q = new Set(tokens(`${input.tema} ${input.palavras}`))
  const maxCarga = Math.max(1, ...Object.values(cargas))
  return docs
    .filter(d => d.disponivel && d.id !== input.orientador && !ocupados.has(d.id))
    .map(d => {
      const perfil = new Set(tokens([...d.especialidades, ...d.curriculo_itens.map(i => i.titulo)].join(' ')))
      let hits = 0
      q.forEach(t => { if (perfil.has(t)) hits++ })
      const relev = Math.min(1, hits / Math.max(1, Math.min(q.size, 4)))
      const score = Math.round(60 * relev + 20 * (NIVEL[d.nivel] / 3) + 20 * (1 - (cargas[d.id] ?? 0) / maxCarga))
      return { docente: d, score }
    })
    .sort((a, b) => b.score - a.score)
}

/** Top 4: presidente = maior nível académico entre eles; restantes por pontuação. */
export function assignSlots(r: Match[]): (Match | null)[] {
  const top = r.slice(0, 4)
  const pres = [...top].sort((a, b) => NIVEL[b.docente.nivel] - NIVEL[a.docente.nivel] || b.score - a.score)[0]
  const resto = top.filter(m => m !== pres)
  return [pres ?? null, resto[0] ?? null, resto[1] ?? null, resto[2] ?? null]
}
