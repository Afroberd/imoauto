import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade — IMOAUTO',
  alternates: { canonical: '/privacidade' },
  description: 'Como o IMOAUTO recolhe, usa e protege os teus dados pessoais.',
}

export default function PrivacidadePage() {
  return (
    <main className="bg-paper">
      <section className="border-b border-shell/70 bg-paper-soft">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-5 sm:py-12">
          <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.2em] text-text-3 sm:tracking-[0.22em]">
            <span className="h-px w-8 bg-line-strong" />
            Legal
          </div>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-[-0.022em] text-ink sm:text-4xl md:text-5xl">
            Política de Privacidade
          </h1>
          <p className="mt-3 text-sm text-text-3">Última atualização: 24 de junho de 2026.</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-8 px-5 py-10 sm:py-12">
        <p className="text-[15px] leading-relaxed text-text-2">
          Os teus dados são tratados por <strong>Afro-Berdiano Image, Sociedade Unipessoal,
          Lda</strong> (NIF 285307002), com sede em Palmarejo, Praia, Cabo Verde — a entidade
          que opera o IMOAUTO e é responsável pelo tratamento dos teus dados pessoais.
          Contacto:{' '}
          <a href="mailto:afroberd@gmail.com" className="text-ink underline underline-offset-2">
            afroberd@gmail.com
          </a>.
        </p>

        <Block n="1" title="Que dados recolhemos">
          <ul className="list-disc space-y-1.5 pl-5">
            <li><strong>Conta:</strong> nome, email e (se fornecida) palavra-passe ou login Google.</li>
            <li><strong>Anúncios:</strong> texto, fotos, preço, localização e contacto que escolhes publicar.</li>
            <li><strong>Mensagens e reservas:</strong> conversas e dados das reservas entre utilizadores.</li>
            <li><strong>Verificação de identidade:</strong> tipo e número de documento (BI/passaporte),
              foto do documento e, se aplicável, carta de condução e telefone.</li>
            <li><strong>Técnicos:</strong> dados de sessão e de utilização necessários para o site funcionar.</li>
          </ul>
        </Block>

        <Block n="2" title="Para que usamos os dados">
          <p>
            Usamos os teus dados para criar e gerir a tua conta, mostrar os teus anúncios, permitir
            mensagens e reservas, confirmar a tua identidade quando necessário, e enviar-te avisos
            (por exemplo, um novo pedido de reserva). Não vendemos os teus dados a terceiros.
          </p>
        </Block>

        <Block n="3" title="Os teus documentos de identidade">
          <p>
            Os documentos que envias para verificação ficam num <strong>armazenamento privado</strong> e
            não são públicos. Só conseguem aceder a eles:
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>tu próprio;</li>
            <li>o anfitrião de uma reserva que faças com ele, quando a reserva o justifica;</li>
            <li>a equipa do IMOAUTO, exclusivamente para confirmar a tua identidade.</li>
          </ul>
          <p className="mt-3">
            Tratamos estes documentos com especial cuidado e usamo-los apenas para o fim da verificação.
          </p>
        </Block>

        <Block n="4" title="Onde os dados são guardados">
          <p>
            O IMOAUTO assenta em fornecedores de infraestrutura cloud (nomeadamente Supabase, para
            base de dados e armazenamento, e Vercel, para alojamento). Os dados podem ser processados
            em servidores fora de Cabo Verde, com medidas técnicas de segurança como controlo de acesso
            por utilizador e armazenamento privado dos documentos.
          </p>
        </Block>

        <Block n="5" title="Quem vê o quê">
          <p>
            O teu nome de utilizador e os teus anúncios publicados são públicos. As tuas mensagens só
            são visíveis para ti e para o outro participante da conversa. Os dados de identidade são
            privados, conforme o ponto 3.
          </p>
        </Block>

        <Block n="6" title="Os teus direitos">
          <p>
            Podes aceder, corrigir ou apagar os teus dados, incluindo a tua conta. A maior parte
            faz-se diretamente no site (perfil, anúncios, verificação). Para pedidos adicionais — como
            apagar a conta e todos os dados associados — contacta-nos pela página de{' '}
            <a href="/contacto" className="text-ink underline underline-offset-2">Contacto</a>.
          </p>
        </Block>

        <Block n="7" title="Cookies">
          <p>
            Usamos apenas os cookies necessários para te manter com sessão iniciada e para o site
            funcionar em segurança. Não usamos cookies de publicidade.
          </p>
        </Block>

        <Block n="8" title="Alterações">
          <p>
            Podemos atualizar esta Política; a data acima indica a versão em vigor. Mudanças
            relevantes serão comunicadas no site.
          </p>
        </Block>
      </section>
    </main>
  )
}

function Block({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="flex items-baseline gap-3 font-display text-xl font-medium text-ink">
        <span className="numeral text-sm text-text-3 tnum">{n}</span>
        {title}
      </h2>
      <div className="mt-2 space-y-2 text-[15px] leading-relaxed text-text-2">{children}</div>
    </div>
  )
}
