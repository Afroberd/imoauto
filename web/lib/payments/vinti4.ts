/**
 * Vinti4 / SISP — integração de pagamento online para Cabo Verde.
 *
 * O Vinti4 (gerido pela SISP) é a rede de cartões de Cabo Verde. Para aceitar
 * pagamentos online é preciso um contrato de comerciante com a SISP, que dá:
 *   - POS ID            (identificador do comerciante)
 *   - POS Auth Code     (chave secreta para assinar os pedidos)
 *   - URL do gateway    (endpoint para onde o formulário é submetido)
 *
 * Fluxo (3-D Secure, estilo redirect):
 *   1. Construímos um formulário com os dados da transação + uma "fingerprint"
 *      assinada com o POS Auth Code, e redirecionamos o hóspede para a SISP.
 *   2. O hóspede paga na página segura da SISP com o cartão Vinti4 / VISA.
 *   3. A SISP faz POST de volta para /api/webhooks/vinti4 com o resultado +
 *      uma fingerprint de resposta que validamos. Em sucesso, inserimos o
 *      payment row (o trigger SQL promove a reserva para 'paid').
 *
 * ATIVAÇÃO: definir no Vercel as variáveis de ambiente:
 *   VINTI4_POS_ID, VINTI4_POS_AUTH_CODE, VINTI4_GATEWAY_URL
 * Enquanto não existirem, VINTI4_ENABLED é false e o método aparece como
 * "em breve" — nada quebra.
 *
 * NOTA: o algoritmo exato da fingerprint (ordem dos campos, hash) é fornecido
 * pela SISP no manual de integração do comerciante. O ponto onde isso entra
 * está marcado com TODO em buildFingerprint(). Tudo o resto já está pronto.
 */

export const VINTI4_ENABLED =
  !!process.env.VINTI4_POS_ID &&
  !!process.env.VINTI4_POS_AUTH_CODE &&
  !!process.env.VINTI4_GATEWAY_URL

export const CVE_CURRENCY_CODE = '132' // ISO 4217 numérico do escudo cabo-verdiano

export interface Vinti4Config {
  posId: string
  posAuthCode: string
  gatewayUrl: string
}

export function getVinti4Config(): Vinti4Config | null {
  if (!VINTI4_ENABLED) return null
  return {
    posId: process.env.VINTI4_POS_ID!,
    posAuthCode: process.env.VINTI4_POS_AUTH_CODE!,
    gatewayUrl: process.env.VINTI4_GATEWAY_URL!,
  }
}

export interface Vinti4PaymentInput {
  bookingId: string
  amountCve: number
  returnUrl: string   // para onde a SISP devolve o hóspede + faz POST do resultado
  reference: string   // referência única da transação
}

/**
 * Campos do formulário a submeter à SISP. O componente cliente faz um
 * auto-submit deste form (POST) para o gateway, redirecionando o utilizador.
 */
export interface Vinti4FormPayload {
  action: string                 // URL do gateway (onde submeter)
  fields: Record<string, string> // campos hidden do formulário
}

export function buildVinti4Form(input: Vinti4PaymentInput): Vinti4FormPayload | null {
  const cfg = getVinti4Config()
  if (!cfg) return null

  const now = new Date()
  const dateTime =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0')

  // O Vinti4/SISP trabalha em escudos inteiros; sem casas decimais para CVE.
  const amount = String(Math.round(input.amountCve))

  const fields: Record<string, string> = {
    posID: cfg.posId,
    merchantRef: input.reference,
    merchantSession: `S${dateTime}`,
    amount,
    currency: CVE_CURRENCY_CODE,
    is3DSec: '1',
    urlMerchantResponse: input.returnUrl,
    languageMessages: 'pt',
    timeStamp: dateTime,
    fingerprintversion: '1',
    entityCode: '',
    referenceNumber: '',
    fingerprint: buildFingerprint(cfg, { amount, dateTime, reference: input.reference }),
  }

  return { action: cfg.gatewayUrl, fields }
}

/**
 * Assina a transação com o POS Auth Code.
 *
 * TODO (ao ativar): substituir pela fórmula exata do manual SISP. Tipicamente
 * é um SHA-512 (em base64) da concatenação, por ordem definida pela SISP, de:
 *   base64(sha512(posAuthCode)) + timestamp + amount*1000 + merchantRef +
 *   merchantSession + posID + currency + transactionCode + ...
 * Como a ordem e os campos variam por versão do contrato, deixamos isolado
 * aqui para ser preenchido com o documento oficial. Até lá devolve string vazia
 * — e como VINTI4_ENABLED exige as 3 env vars, este caminho nunca corre em
 * produção sem configuração real.
 */
function buildFingerprint(
  _cfg: Vinti4Config,
  _tx: { amount: string; dateTime: string; reference: string },
): string {
  // Implementar com o manual de integração SISP no momento da ativação.
  return ''
}

/** Valida a fingerprint de resposta da SISP no callback (TODO: fórmula SISP). */
export function verifyVinti4Response(_params: Record<string, string>): boolean {
  // Implementar com o manual SISP. Por defeito rejeita, para não aceitar
  // pagamentos não verificados por engano.
  return false
}
