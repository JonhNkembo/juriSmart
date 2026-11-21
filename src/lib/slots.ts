// Datas abertas para defesas e horários livres de cada dia.

export type DataDefesa = {
  id: string; data: string            // AAAA-MM-DD
  hora_inicio: string; hora_fim: string  // HH:MM[:SS]
  duracao_min: number; local: string | null; ativa: boolean
}
export type Horario = { hora: string; livre: boolean }
export type Dia = { dia: DataDefesa; horas: Horario[]; livres: number; total: number; legado?: boolean }

const p2 = (n: number) => String(n).padStart(2, '0')
export const hhmm = (t: string) => t.slice(0, 5)
const emMin = (t: string) => { const [h, m] = hhmm(t).split(':').map(Number); return h * 60 + m }

/** Início de cada defesa possível num dia: de hora_inicio até caber a duração antes de hora_fim. */
export function horasDoDia(d: Pick<DataDefesa, 'hora_inicio' | 'hora_fim' | 'duracao_min'>): string[] {
  const out: string[] = []
  for (let t = emMin(d.hora_inicio); t + d.duracao_min <= emMin(d.hora_fim); t += d.duracao_min) out.push(`${p2(Math.floor(t / 60))}:${p2(t % 60)}`)
  return out
}

/** Data e hora locais de um instante (a secretaria trabalha na hora local). */
export function chaveLocal(iso: string) {
  const d = new Date(iso)
  return { data: `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`, hora: `${p2(d.getHours())}:${p2(d.getMinutes())}` }
}
export const hojeLocal = () => chaveLocal(new Date().toISOString()).data
export const instante = (data: string, hora: string) => new Date(`${data}T${hora}:00`)

/**
 * Horários de um dia e quais estão livres. Uma banca ocupa o horário se a sua hora de início
 * estiver a menos de uma duração de distância (não há duas defesas sobrepostas).
 * Horários que já passaram contam como indisponíveis.
 */
export function ocupacaoDoDia(dia: DataDefesa, bancas: { data_hora: string }[], agora: Date = new Date()): Dia {
  const ocupadas = bancas.map(b => chaveLocal(b.data_hora)).filter(k => k.data === dia.data).map(k => emMin(k.hora))
  const horas = horasDoDia(dia).map(h => ({
    hora: h,
    livre: !ocupadas.some(o => Math.abs(o - emMin(h)) < dia.duracao_min) && instante(dia.data, h).getTime() > agora.getTime(),
  }))
  return { dia, horas, livres: horas.filter(h => h.livre).length, total: horas.length }
}

export const rotuloDia = (data: string, opcoes: Intl.DateTimeFormatOptions = { weekday: 'short', day: '2-digit', month: 'short' }) =>
  new Date(`${data}T12:00:00`).toLocaleDateString('pt-AO', opcoes)
