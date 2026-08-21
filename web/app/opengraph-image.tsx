import { ImageResponse } from 'next/og'

// Imagem de partilha (Open Graph) por defeito do site — aparece quando se
// partilha o IMOAUTO no WhatsApp/Facebook/etc. Gerada com next/og (flexbox).
export const alt = 'IMOAUTO — Imóveis e Automóveis em Cabo Verde'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '90px',
          background: '#0B2E40',
          color: '#FAF7F0',
          fontFamily: 'sans-serif',
        }}
      >
        <svg width="230" height="153" viewBox="0 0 120 80" fill="none"
          stroke="#FAF7F0" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M66 40 L92 14 L114 36 L114 62" />
          <path d="M104 25 L104 16 L109 16 L109 29" />
          <path d="M8 62 L8 53 Q8 47.5 13.5 45.5 L25 42 Q28 39 32 39 L50 38 L58 30 Q61.5 28 67 28 L84 30 Q99 33 104 62" />
          <line x1="8" y1="62" x2="114" y2="62" />
          <circle cx="34" cy="56" r="6.4" />
        </svg>
        <div style={{ fontSize: 30, letterSpacing: 6, color: '#9FB9C4', marginTop: 30 }}>
          CABO VERDE
        </div>
        <div style={{ fontSize: 110, fontWeight: 700, marginTop: 14 }}>ImoAuto</div>
        <div style={{ fontSize: 42, marginTop: 28, color: '#D7E3E8', maxWidth: 950 }}>
          Imóveis e automóveis — comprar, vender e alugar em todas as nove ilhas.
        </div>
        <div style={{ fontSize: 28, marginTop: 'auto', color: '#9FB9C4' }}>
          www.imoauto.cv
        </div>
      </div>
    ),
    { ...size },
  )
}
