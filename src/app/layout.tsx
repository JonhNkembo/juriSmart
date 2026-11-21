import './globals.css'
import { Inter, Source_Serif_4 } from 'next/font/google'
import AuthShell from '@/components/AuthShell'
import ProgressoTopo from '@/components/ProgressoTopo'

const inter = Inter({ subsets: ['latin'] })
// Títulos em serifa: o resultado do sistema é um documento formal (ficha da banca).
const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif' })
export const metadata = { title: 'JúriSmart AI — Agendamento de Júris de TCC' }

// Quem já tem sessão guardada não deve ver a página inicial durante um instante antes do painel.
const antesDePintar = "try{for(var k in localStorage){if(/^sb-.*-auth-token$/.test(k)){document.documentElement.setAttribute('data-sessao','1');break}}}catch(e){}"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={serif.variable} suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <script dangerouslySetInnerHTML={{ __html: antesDePintar }} />
      </head>
      <body className={`${inter.className} bg-slate-50 text-slate-800 antialiased`}>
        <ProgressoTopo />
        <AuthShell>{children}</AuthShell>
      </body>
    </html>
  )
}
