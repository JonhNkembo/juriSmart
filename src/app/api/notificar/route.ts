import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { montarEmails, type Banca, type Tipo } from '@/lib/emails'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Linha = {
  id: string; tema: string; estudante: string; estudante_id: string | null; data_hora: string; local: string | null
  orientador: { nome: string; email: string } | null
  juri_membros: { papel: string; docente: { nome: string; email: string } | null }[]
}

function transporte() {
  if (process.env.EMAIL_MODO === 'teste') return nodemailer.createTransport({ jsonTransport: true })
  const host = process.env.SMTP_HOST
  if (!host) return null
  const porta = Number(process.env.SMTP_PORT ?? 587)
  return nodemailer.createTransport({
    host, port: porta, secure: porta === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  })
}

export async function POST(req: Request) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ erro: 'Sem sessão iniciada.' }, { status: 401 })

  const corpo = await req.json().catch(() => null) as { tipo?: Tipo; juriId?: string } | null
  if (!corpo?.juriId || !['convocatoria', 'atualizacao', 'examinada'].includes(corpo.tipo ?? '')) {
    return NextResponse.json({ erro: 'Pedido inválido.' }, { status: 400 })
  }

  // Todas as leituras usam a sessão de quem pediu: as regras de acesso do Supabase continuam a valer.
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  const { data: u, error: eu } = await sb.auth.getUser(token)
  if (eu || !u.user) return NextResponse.json({ erro: 'Sessão inválida.' }, { status: 401 })
  const { data: eu_ } = await sb.from('perfis').select('perfil,estado').eq('id', u.user.id).single()
  if (eu_?.perfil !== 'administrador' || eu_?.estado !== 'ativo') {
    return NextResponse.json({ erro: 'Apenas o administrador pode enviar avisos.' }, { status: 403 })
  }

  const t = transporte()
  if (!t) return NextResponse.json({ erro: 'O envio de emails ainda não está configurado (ficheiro .env: SMTP_HOST, SMTP_USER, SMTP_PASS).' }, { status: 501 })

  const { data: j, error: ej } = await sb.from('juris')
    .select('id,tema,estudante,estudante_id,data_hora,local,orientador:docentes!orientador_id(nome,email),juri_membros(papel,docente:docentes(nome,email))')
    .eq('id', corpo.juriId).single()
  if (ej || !j) return NextResponse.json({ erro: 'Banca não encontrada.' }, { status: 404 })
  const l = j as unknown as Linha

  let estudanteEmail: string | null = null
  if (l.estudante_id) {
    const { data: e } = await sb.from('perfis').select('email').eq('id', l.estudante_id).maybeSingle()
    estudanteEmail = e?.email ?? null
  }
  const banca: Banca = {
    id: l.id, tema: l.tema, estudante: l.estudante, data_hora: l.data_hora, local: l.local, estudanteEmail,
    orientador: l.orientador,
    membros: l.juri_membros.flatMap(m => (m.docente ? [{ papel: m.papel, nome: m.docente.nome, email: m.docente.email }] : [])),
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin
  const mensagens = montarEmails(corpo.tipo as Tipo, banca, appUrl)
  const de = process.env.EMAIL_FROM || process.env.SMTP_USER || 'JúriSmart AI <no-reply@jurismart.local>'

  const enviados: { para: string; assunto: string }[] = []
  const falhas: { para: string; motivo: string }[] = []
  for (const m of mensagens) {
    try {
      await t.sendMail({ from: de, to: m.para, subject: m.assunto, text: m.texto, html: m.html })
      enviados.push({ para: m.para, assunto: m.assunto })
    } catch (e) {
      falhas.push({ para: m.para, motivo: e instanceof Error ? e.message : 'erro desconhecido' })
    }
  }
  return NextResponse.json({ enviados, falhas, semDestinatarios: mensagens.length === 0 })
}
