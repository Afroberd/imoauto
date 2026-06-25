import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Utilização — IMOAUTO',
  description: 'As regras de utilização do IMOAUTO, o marketplace de imóveis e automóveis de Cabo Verde.',
}

export default function TermosPage() {
  return (
    <main className="bg-paper">
      <section className="border-b border-shell/70 bg-paper-soft">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-5 sm:py-12">
          <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.2em] text-text-3 sm:tracking-[0.22em]">
            <span className="h-px w-8 bg-line-strong" />
            Legal
          </div>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-[-0.022em] text-ink sm:text-4xl md:text-5xl">
            Termos de Utilização
          </h1>
          <p className="mt-3 text-sm text-text-3">Última atualização: 24 de junho de 2026.</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-8 px-5 py-10 sm:py-12">
        <Block n="1" title="O que é o IMOAUTO">
          <p>
            O IMOAUTO é uma plataforma online que liga quem anuncia imóveis e automóveis
            (para venda ou aluguer) a quem procura, em todas as ilhas de Cabo Verde.
            Somos apenas o intermediário tecnológico: os negócios são feitos diretamente
            entre os utilizadores. O IMOAUTO <strong>não é parte</strong> de nenhuma compra,
            venda, arrendamento ou reserva, e não cobra comissões sobre as transações.
          </p>
        </Block>

        <Block n="2" title="Conta de utilizador">
          <p>
            Para anunciar, reservar ou enviar mensagens precisas de criar uma conta. És
            responsável por manter a tua palavra-passe segura e por toda a atividade na tua
            conta. Os dados que forneces devem ser verdadeiros e atualizados. Podemos suspender
            ou encerrar contas que violem estes Termos ou a lei.
          </p>
        </Block>

        <Block n="3" title="Regras dos anúncios">
          <p>O anúncio é da tua responsabilidade. Ao publicar, comprometes-te a que:</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>tens o direito de vender ou alugar o bem anunciado;</li>
            <li>a informação (preço, estado, localização, fotos) é verdadeira e não enganadora;</li>
            <li>não publicas conteúdo ilegal, fraudulento, ofensivo ou que infrinja direitos de terceiros;</li>
            <li>não duplicas anúncios nem publicas spam.</li>
          </ul>
          <p className="mt-3">
            Podemos remover anúncios que violem estas regras, sem aviso prévio.
          </p>
        </Block>

        <Block n="4" title="Reservas e pagamentos">
          <p>
            Para aluguer diário, o IMOAUTO disponibiliza um sistema de reservas e um registo de
            pagamentos. O pagamento pode ser combinado entre as partes (por exemplo, na chegada).
            O IMOAUTO não guarda dados de cartão e não é responsável por pagamentos feitos fora
            da plataforma. Cancelamentos e reembolsos seguem a política indicada em cada anúncio.
          </p>
        </Block>

        <Block n="5" title="Verificação de identidade">
          <p>
            Alguns anúncios (sobretudo aluguer diário) podem exigir identidade verificada. Ao
            submeteres documentos, autorizas o IMOAUTO a tratá-los apenas para confirmar a tua
            identidade, conforme a{' '}
            <a href="/privacidade" className="text-ink underline underline-offset-2">Política de Privacidade</a>.
          </p>
        </Block>

        <Block n="6" title="Responsabilidade">
          <p>
            O IMOAUTO disponibiliza a plataforma &quot;tal como está&quot; e não garante a veracidade
            dos anúncios nem o comportamento dos utilizadores. Recomendamos prudência: confirma o
            bem pessoalmente, valida documentos e desconfia de pedidos de pagamento antecipado
            invulgares. O IMOAUTO não é responsável por perdas resultantes de negócios entre
            utilizadores.
          </p>
        </Block>

        <Block n="7" title="Alterações e lei aplicável">
          <p>
            Podemos atualizar estes Termos; a data acima indica a última versão. Estes Termos
            regem-se pela lei da República de Cabo Verde. Em caso de dúvida, contacta-nos pela
            página de{' '}
            <a href="/contacto" className="text-ink underline underline-offset-2">Contacto</a>.
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
