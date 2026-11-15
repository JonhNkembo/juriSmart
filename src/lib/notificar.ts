import { supabase } from './supabase'

export type ResultadoAviso = { ok: boolean; txt: string }

/** Pede ao servidor para enviar os emails da banca (só o administrador pode). */
export async function notificar(tipo: 'convocatoria' | 'atualizacao' | 'examinada', juriId: string): Promise<ResultadoAviso> {
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return { ok: false, txt: 'Sem sessão iniciada.' }
    const r = await fetch('/api/notificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tipo, juriId }),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) return { ok: false, txt: j.erro ?? 'Não foi possível enviar os emails.' }
    const n = (j.enviados ?? []).length
    const f = (j.falhas ?? []).length
    if (j.semDestinatarios) return { ok: false, txt: 'Não há emails de destinatários para avisar.' }
    if (f > 0) return { ok: n > 0, txt: `${n} email(s) enviado(s); ${f} falhou (${j.falhas[0].motivo}).` }
    return { ok: true, txt: `${n} email(s) enviado(s) aos participantes.` }
  } catch {
    return { ok: false, txt: 'Não foi possível contactar o servidor de emails.' }
  }
}
