'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { PERFIS } from '@/lib/perfis'
import { inp, traduzErro, Senha, ForcaSenha } from '@/components/AuthLayout'
import Avatar from '@/components/Avatar'
import Barra from '@/components/Barra'

const lbl = 'block text-[13px] font-semibold text-slate-700 mb-1.5'
type Aviso = { ok: boolean; txt: string } | null

function Cartao({ icone, titulo, children }: { icone: string; titulo: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <h3 className="bg-brand-900 text-white text-sm font-bold px-6 py-3 border-b-4 border-amber-400"><i className={`fa-solid ${icone} mr-2`} />{titulo}</h3>
      <div className="p-6">{children}</div>
    </section>
  )
}
const Msg = ({ a }: { a: Aviso }) => a ? (
  <p className={`text-sm mt-4 ${a.ok ? 'text-emerald-700' : 'text-rose-600'}`}>
    <i className={`fa-solid ${a.ok ? 'fa-circle-check' : 'fa-circle-exclamation'} mr-2`} />{a.txt}
  </p>
) : null
const Botao = ({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) => (
  <button disabled={disabled} className="mt-5 h-10 px-6 rounded-md bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white text-sm font-semibold shadow-sm">{children}</button>
)

// recorta ao centro em quadrado e reduz (a foto fica leve e uniforme)
function reduzir(file: File, lado: number): Promise<Blob> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const m = Math.min(img.width, img.height)
      const c = document.createElement('canvas'); c.width = c.height = lado
      c.getContext('2d')!.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, lado, lado)
      URL.revokeObjectURL(url)
      c.toBlob(b => (b ? res(b) : rej(new Error('Não foi possível processar a imagem.'))), 'image/jpeg', 0.85)
    }
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Ficheiro de imagem inválido.')) }
    img.src = url
  })
}

export default function Conta() {
  const { perfil, recarregar } = useAuth()
  const ehJuri = perfil.perfil === 'juri'
  const [dados, setDados] = useState({ nome: perfil.nome, telefone: perfil.telefone ?? '' })
  const [aDados, setADados] = useState<Aviso>(null)
  const [aFoto, setAFoto] = useState<Aviso>(null)
  const [doc, setDoc] = useState({ grau: '', nivel: 'Doutorado', esp: '', disponivel: true })
  const [aDoc, setADoc] = useState<Aviso>(null)
  const [pw, setPw] = useState({ atual: '', nova: '', conf: '' })
  const [aPw, setAPw] = useState<Aviso>(null)
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!ehJuri || !perfil.docente_id) return
    supabase.from('docentes').select('grau,nivel,especialidades,disponivel').eq('id', perfil.docente_id).single()
      .then(({ data }) => data && setDoc({ grau: data.grau, nivel: data.nivel, esp: (data.especialidades as string[]).join(', '), disponivel: data.disponivel }))
  }, [ehJuri, perfil.docente_id])

  async function escolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setAFoto(null)
    if (!f.type.startsWith('image/')) return setAFoto({ ok: false, txt: 'Escolha um ficheiro de imagem (JPG, PNG ou WebP).' })
    if (f.size > 8 * 1024 * 1024) return setAFoto({ ok: false, txt: 'A imagem deve ter no máximo 8 MB.' })
    setBusy(true)
    try {
      const blob = await reduzir(f, 400)
      const caminho = `${perfil.id}/avatar.jpg`
      const { error } = await supabase.storage.from('avatars').upload(caminho, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' })
      if (error) throw new Error(/bucket not found/i.test(error.message) ? 'Falta atualizar a base de dados: execute o supabase/perfis.sql.' : error.message)
      const url = `${supabase.storage.from('avatars').getPublicUrl(caminho).data.publicUrl}?v=${Date.now()}`
      const { error: e2 } = await supabase.from('perfis').update({ foto_url: url }).eq('id', perfil.id)
      if (e2) throw new Error(e2.message)
      await recarregar(); setAFoto({ ok: true, txt: 'Foto de perfil atualizada.' })
    } catch (err) {
      setAFoto({ ok: false, txt: err instanceof Error ? err.message : 'Não foi possível guardar a foto.' })
    }
    setBusy(false)
  }

  async function removerFoto() {
    if (!window.confirm('Remover a foto de perfil?')) return
    setBusy(true); setAFoto(null)
    await supabase.storage.from('avatars').remove([`${perfil.id}/avatar.jpg`])
    const { error } = await supabase.from('perfis').update({ foto_url: null }).eq('id', perfil.id)
    await recarregar(); setBusy(false)
    setAFoto(error ? { ok: false, txt: error.message } : { ok: true, txt: 'Foto removida.' })
  }

  async function guardarDados(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setADados(null)
    const { error } = await supabase.from('perfis').update({ nome: dados.nome, telefone: dados.telefone || null }).eq('id', perfil.id)
    if (error) { setBusy(false); return setADados({ ok: false, txt: error.message }) }
    await supabase.auth.updateUser({ data: { nome: dados.nome } })
    if (ehJuri && perfil.docente_id) await supabase.from('docentes').update({ nome: dados.nome }).eq('id', perfil.docente_id)
    await recarregar(); setBusy(false); setADados({ ok: true, txt: 'Dados guardados.' })
  }

  async function guardarDocente(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setADoc(null)
    const { error } = await supabase.from('docentes').update({
      grau: doc.grau, nivel: doc.nivel, disponivel: doc.disponivel,
      especialidades: doc.esp.split(',').map(s => s.trim()).filter(Boolean),
    }).eq('id', perfil.docente_id!)
    setBusy(false)
    setADoc(error ? { ok: false, txt: error.message } : { ok: true, txt: 'Dados de investigador guardados.' })
  }

  async function mudarSenha(e: React.FormEvent) {
    e.preventDefault(); setAPw(null)
    if (pw.nova.length < 6) return setAPw({ ok: false, txt: 'A nova palavra-passe deve ter pelo menos 6 caracteres.' })
    if (pw.nova !== pw.conf) return setAPw({ ok: false, txt: 'A confirmação não coincide com a nova palavra-passe.' })
    if (pw.nova === pw.atual) return setAPw({ ok: false, txt: 'A nova palavra-passe deve ser diferente da actual.' })
    setBusy(true)
    const { error: e1 } = await supabase.auth.signInWithPassword({ email: perfil.email, password: pw.atual })
    if (e1) { setBusy(false); return setAPw({ ok: false, txt: /invalid login/i.test(e1.message) ? 'A palavra-passe actual está incorrecta.' : traduzErro(e1.message) }) }
    const { error } = await supabase.auth.updateUser({ password: pw.nova })
    setBusy(false)
    if (error) return setAPw({ ok: false, txt: traduzErro(error.message) })
    setPw({ atual: '', nova: '', conf: '' }); setAPw({ ok: true, txt: 'Palavra-passe alterada.' })
  }

  const info = PERFIS[perfil.perfil]
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Avatar nome={perfil.nome} foto={perfil.foto_url} tam={64} />
        <div>
          <h2 className="text-xl font-bold">{perfil.nome}</h2>
          <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-brand-50 text-brand-800 border border-brand-100 text-xs font-bold">{info.rotulo} ({info.detalhe})</span>
        </div>
      </div>

      {(() => {
        const itens = [
          ['Foto de perfil', !!perfil.foto_url], ['Telefone', !!perfil.telefone],
          ...(ehJuri ? [['Especialidades', doc.esp.trim().length > 0]] as [string, boolean][] : []),
        ] as [string, boolean][]
        const feitos = itens.filter(i => i[1]).length
        return (
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex justify-between text-sm"><span className="font-semibold text-slate-700">Perfil completo</span><span className="text-slate-500">{feitos} de {itens.length}</span></div>
            <Barra valor={feitos} max={itens.length} cor={feitos === itens.length ? 'bg-emerald-600' : 'bg-brand-600'} className="mt-2" rotulo="Perfil completo" />
            {feitos < itens.length && <p className="text-xs text-slate-500 mt-2">Falta: {itens.filter(i => !i[1]).map(i => i[0].toLowerCase()).join(', ')}.</p>}
          </div>
        )
      })()}

      <Cartao icone="fa-camera" titulo="Foto de perfil">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <Avatar nome={perfil.nome} foto={perfil.foto_url} tam={96} className="ring-4 ring-slate-100" />
          <div>
            <input ref={input} type="file" accept="image/*" onChange={escolherFoto} className="hidden" />
            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={busy} onClick={() => input.current?.click()}
                className="h-10 px-5 rounded-md bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white text-sm font-semibold shadow-sm">
                <i className="fa-solid fa-upload mr-2" />{perfil.foto_url ? 'Alterar foto' : 'Escolher foto'}
              </button>
              {perfil.foto_url && (
                <button type="button" disabled={busy} onClick={removerFoto}
                  className="h-10 px-5 rounded-md border border-rose-200 bg-white text-rose-600 text-sm font-semibold hover:bg-rose-50 disabled:opacity-60">
                  <i className="fa-solid fa-trash mr-2" />Remover
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">JPG, PNG ou WebP, até 8 MB. A imagem é recortada em quadrado.</p>
          </div>
        </div>
        {busy && <Barra indeterminada altura="h-1.5" className="mt-4" rotulo="A enviar a foto" />}
        <Msg a={aFoto} />
      </Cartao>

      <Cartao icone="fa-id-card" titulo="Dados da conta">
        <form onSubmit={guardarDados}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div><label className={lbl}>Nome completo</label><input required className={inp} value={dados.nome} onChange={e => setDados({ ...dados, nome: e.target.value })} /></div>
            <div><label className={lbl}>Telefone</label><input className={inp} value={dados.telefone} onChange={e => setDados({ ...dados, telefone: e.target.value })} placeholder="+244 9XX XXX XXX" /></div>
            <div className="md:col-span-2"><label className={lbl}>Email</label>
              <input type="email" className={`${inp} bg-slate-100 text-slate-500 cursor-not-allowed`} value={perfil.email} disabled readOnly />
              <p className="text-xs text-slate-500 mt-1.5"><i className="fa-solid fa-lock mr-1.5" />O email não pode ser alterado. É nele que recebe os avisos do sistema.</p></div>
          </div>
          <Botao disabled={busy}>Guardar alterações</Botao><Msg a={aDados} />
        </form>
      </Cartao>

      {ehJuri && perfil.docente_id && (
        <Cartao icone="fa-user-graduate" titulo="Dados de investigador">
          <form onSubmit={guardarDocente}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className={lbl}>Formação / Grau</label><input required className={inp} value={doc.grau} onChange={e => setDoc({ ...doc, grau: e.target.value })} /></div>
              <div><label className={lbl}>Nível académico</label>
                <select className={inp} value={doc.nivel} onChange={e => setDoc({ ...doc, nivel: e.target.value })}><option>Doutorado</option><option>Mestrado</option><option>Licenciatura</option></select></div>
              <div className="md:col-span-2"><label className={lbl}>Especialidades (separadas por vírgula)</label><input className={inp} value={doc.esp} onChange={e => setDoc({ ...doc, esp: e.target.value })} /></div>
            </div>
            <label className="flex items-center gap-2 mt-4 text-sm text-slate-700">
              <input type="checkbox" checked={doc.disponivel} onChange={e => setDoc({ ...doc, disponivel: e.target.checked })} /> Disponível para integrar júris
            </label>
            <div className="flex flex-wrap items-center gap-4"><Botao disabled={busy}>Guardar dados de investigador</Botao>
              <Link href="/curriculo" className="mt-5 text-sm font-semibold text-brand-700 hover:underline"><i className="fa-solid fa-book-open mr-1.5" />Gerir o meu currículo</Link></div>
            <Msg a={aDoc} />
          </form>
        </Cartao>
      )}

      <Cartao icone="fa-key" titulo="Alterar palavra-passe">
        <form onSubmit={mudarSenha}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2"><label className={lbl}>Palavra-passe actual</label><Senha value={pw.atual} onChange={v => setPw({ ...pw, atual: v })} placeholder="A sua palavra-passe actual" /></div>
            <div><label className={lbl}>Nova palavra-passe</label><Senha novo value={pw.nova} onChange={v => setPw({ ...pw, nova: v })} placeholder="Mínimo 6 caracteres" /></div>
            <div><label className={lbl}>Confirmar nova palavra-passe</label><Senha novo value={pw.conf} onChange={v => setPw({ ...pw, conf: v })} placeholder="Repita a nova palavra-passe" /></div>
            <div className="md:col-span-2 -mt-2"><ForcaSenha senha={pw.nova} conf={pw.conf} /></div>
          </div>
          <Botao disabled={busy}>Alterar palavra-passe</Botao><Msg a={aPw} />
        </form>
      </Cartao>
    </div>
  )
}
