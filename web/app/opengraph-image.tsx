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
        <div style={{ fontSize: 30, letterSpacing: 6, color: '#9FB9C4' }}>
          CABO VERDE
        </div>
        <div style={{ fontSize: 110, fontWeight: 700, marginTop: 18 }}>ImoAuto</div>
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
