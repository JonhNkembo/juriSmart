// Montagem das mensagens de email (sem envio). Usado pela rota /api/notificar.

export type Tipo = 'convocatoria' | 'atualizacao' | 'examinada'
export type Banca = {
  id: string; tema: string; estudante: string; data_hora: string; local: string | null
  estudanteEmail: string | null
  orientador: { nome: string; email: string } | null
  membros: { papel: string; nome: string; email: string }[]
}
export type Mensagem = { para: string; assunto: string; html: string; texto: string }

const PAPEL: Record<string, string> = { presidente: 'Presidente', vogal1: '1.º Vogal', vogal2: '2.º Vogal', suplente: 'Suplente' }
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const quando = (iso: string) => new Date(iso).toLocaleString('pt-AO', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Africa/Luanda' })

function moldura(titulo: string, corpo: string, botao: { texto: string; url: string }) {
  return `<div style="background:#f1f5f9;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" align="center" width="100%" style="max-width:560px;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">
    <tr><td style="background:#0c4a6e;border-bottom:4px solid #fbbf24;padding:22px 26px;color:#ffffff;">
      <div style="font-size:19px;font-weight:bold;">JúriSmart <span style="color:#22d3ee;">AI</span></div>
      <div style="font-size:12px;color:#bae6fd;margin-top:2px;">Agendamento de Júris de TCC</div>
    </td></tr>
    <tr><td style="padding:28px 26px;color:#334155;font-size:15px;line-height:1.6;">
      <h2 style="margin:0 0 14px;color:#0f172a;font-size:19px;">${esc(titulo)}</h2>
      ${corpo}
      <p style="text-align:center;margin:26px 0 6px;"><a href="${esc(botao.url)}" style="background:#0369a1;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 26px;border-radius:6px;display:inline-block;">${esc(botao.texto)}</a></p>
    </td></tr>
    <tr><td style="background:#f8fafc;padding:14px 26px;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;">Mensagem automática do JúriSmart AI. Não responda a este email.</td></tr>
  </table></div>`
}

const linha = (r: string, v: string) => `<tr><td style="padding:4px 12px 4px 0;color:#64748b;white-space:nowrap;">${esc(r)}</td><td style="padding:4px 0;color:#0f172a;font-weight:bold;">${esc(v)}</td></tr>`
const tabela = (l: [string, string][]) => `<table role="presentation" style="margin:12px 0;font-size:14px;">${l.map(([r, v]) => linha(r, v)).join('')}</table>`

export function montarEmails(tipo: Tipo, b: Banca, appUrl: string): Mensagem[] {
  const out: Mensagem[] = []
  const data = quando(b.data_hora)
  const mesaTxt = b.membros.map(m => `${PAPEL[m.papel] ?? m.papel}: ${m.nome}`).join('\n')
  const mesaHtml = tabela(b.membros.map(m => [PAPEL[m.papel] ?? m.papel, m.nome] as [string, string]))
  const comuns: [string, string][] = [['Candidato', b.estudante], ['Tema', b.tema], ['Data e hora', data], ...(b.local ? [['Local', b.local] as [string, string]] : [])]
  const localTxt = b.local ? `\nLocal: ${b.local}` : ''
  const alvo = (url: string) => `${appUrl.replace(/\/$/, '')}${url}`

  if (tipo === 'examinada') {
    if (b.estudanteEmail) {
      out.push({
        para: b.estudanteEmail,
        assunto: 'A sua defesa de TCC foi examinada',
        texto: `Olá, ${b.estudante}.\n\nA sua defesa do TCC "${b.tema}" (${data}) foi dada como examinada.\n\nMesa:\n${mesaTxt}\n\nPode consultar os detalhes em ${alvo('/bancas')}`,
        html: moldura('A sua defesa foi examinada',
          `<p>Olá, <b>${esc(b.estudante)}</b>.</p><p>A sua defesa do TCC foi dada como <b>examinada</b>.</p>${tabela(comuns)}<p style="margin:8px 0 0;">Mesa examinadora:</p>${mesaHtml}`,
          { texto: 'Ver a minha banca', url: alvo('/bancas') }),
      })
    }
    const vistos = new Set<string>()
    const equipa = [...(b.orientador ? [{ papel: 'Orientador', ...b.orientador }] : []), ...b.membros.map(m => ({ papel: PAPEL[m.papel] ?? m.papel, nome: m.nome, email: m.email }))]
    for (const p of equipa) {
      if (!p.email || vistos.has(p.email.toLowerCase())) continue
      vistos.add(p.email.toLowerCase())
      out.push({
        para: p.email,
        assunto: `Banca examinada: ${b.estudante}`,
        texto: `Olá, ${p.nome}.\n\nA defesa de ${b.estudante} ("${b.tema}", ${data}) foi dada como examinada. O seu papel: ${p.papel}.\n\nObrigado pela participação.\n${alvo('/bancas')}`,
        html: moldura('Banca examinada',
          `<p>Olá, <b>${esc(p.nome)}</b>.</p><p>A defesa abaixo foi dada como <b>examinada</b>. Obrigado pela sua participação.</p>${tabela([...comuns, ['O seu papel', p.papel]])}`,
          { texto: 'Ver as minhas defesas', url: alvo('/bancas') }),
      })
    }
    return out
  }

  const atualizada = tipo === 'atualizacao'
  const titulo = atualizada ? 'A banca foi atualizada' : 'Foi marcada uma banca'
  if (b.estudanteEmail) {
    out.push({
      para: b.estudanteEmail,
      assunto: atualizada ? 'A sua banca de TCC foi atualizada' : 'A sua banca de TCC foi marcada',
      texto: `Olá, ${b.estudante}.\n\n${atualizada ? 'A sua banca foi atualizada' : 'A sua defesa foi marcada'}.\nTema: ${b.tema}\nData: ${data}${localTxt}\n\nMesa:\n${mesaTxt}\n\nNo sistema pode ver a justificação da escolha de cada júri: ${alvo('/bancas')}`,
      html: moldura(atualizada ? 'A sua banca foi atualizada' : 'A sua defesa foi marcada',
        `<p>Olá, <b>${esc(b.estudante)}</b>.</p>${tabela(comuns)}<p style="margin:8px 0 0;">Mesa examinadora:</p>${mesaHtml}<p style="font-size:13px;color:#64748b;">No sistema pode ver a justificação da escolha de cada júri.</p>`,
        { texto: 'Ver a minha banca', url: alvo('/bancas') }),
    })
  }
  const vistos = new Set<string>()
  const equipa = [
    ...(b.orientador ? [{ papel: 'Orientador', ...b.orientador }] : []),
    ...b.membros.map(m => ({ papel: PAPEL[m.papel] ?? m.papel, nome: m.nome, email: m.email })),
  ]
  for (const p of equipa) {
    if (!p.email || vistos.has(p.email.toLowerCase())) continue
    vistos.add(p.email.toLowerCase())
    out.push({
      para: p.email,
      assunto: `${atualizada ? 'Banca atualizada' : 'Foi escolhido para uma banca'}: ${b.estudante}`,
      texto: `Olá, ${p.nome}.\n\n${atualizada ? 'A banca abaixo foi atualizada' : 'Foi escolhido para integrar a banca abaixo'}.\nO seu papel: ${p.papel}\nCandidato: ${b.estudante}\nTema: ${b.tema}\nData: ${data}${localTxt}\n\n${alvo('/bancas')}`,
      html: moldura(titulo,
        `<p>Olá, <b>${esc(p.nome)}</b>.</p><p>${atualizada ? 'A banca abaixo foi atualizada.' : 'Foi escolhido para integrar a banca abaixo.'}</p>${tabela([['O seu papel', p.papel], ...comuns])}`,
        { texto: 'Ver as minhas defesas', url: alvo('/bancas') }),
    })
  }
  return out
}
