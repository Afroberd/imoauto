import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contacto — IMOAUTO',
  description: 'Fala com a equipa do IMOAUTO.',
}

const SUPPORT_EMAIL = 'afroberd@gmail.com'
const SUPPORT_WHATSAPP = '+238 937 20 69' // número de WhatsApp/telefone
const WHATSAPP_DIGITS = '2389372069' // só dígitos, para o link wa.me

export default function ContactoPage() {
  return (
    <main className="bg-paper">
      <section className="border-b border-shell/70 bg-paper-soft">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-5 sm:py-12">
          <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.2em] text-text-3 sm:tracking-[0.22em]">
            <span className="h-px w-8 bg-line-strong" />
            Apoio
          </div>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-[-0.022em] text-ink sm:text-4xl md:text-5xl">
            Fala connosco
          </h1>
          <p className="mt-3 max-w-xl text-sm text-text-2">
            Dúvidas, problemas com um anúncio ou com a tua conta? Estamos aqui para ajudar.
            Respondemos normalmente no prazo de 24 horas úteis.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-10 sm:py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="group rounded-[var(--radius-card)] border border-shell bg-white p-6 shadow-[var(--shadow-card)] transition-colors hover:border-ink"
          >
            <h2 className="text-[12px] font-medium uppercase tracking-[0.15em] text-text-3">Email</h2>
            <p className="mt-2 font-display text-xl text-ink">{SUPPORT_EMAIL}</p>
            <span className="mt-3 inline-block text-sm text-ink underline-offset-4 group-hover:underline">
              Enviar email →
            </span>
          </a>

          <a
            href={`https://wa.me/${WHATSAPP_DIGITS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-[var(--radius-card)] border border-shell bg-white p-6 shadow-[var(--shadow-card)] transition-colors hover:border-ink"
          >
            <h2 className="text-[12px] font-medium uppercase tracking-[0.15em] text-text-3">WhatsApp</h2>
            <p className="mt-2 font-display text-xl text-ink">{SUPPORT_WHATSAPP}</p>
            <span className="mt-3 inline-block text-sm text-ink underline-offset-4 group-hover:underline">
              Abrir conversa →
            </span>
          </a>
        </div>

        <p className="mt-8 text-[13px] leading-relaxed text-text-3">
          Para questões sobre os teus dados pessoais, consulta a{' '}
          <a href="/privacidade" className="text-ink underline underline-offset-2">Política de Privacidade</a>.
          As regras de utilização estão nos{' '}
          <a href="/termos" className="text-ink underline underline-offset-2">Termos de Utilização</a>.
        </p>
      </section>
    </main>
  )
}
