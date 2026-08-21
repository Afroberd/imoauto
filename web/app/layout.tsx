import type { Metadata, Viewport } from 'next'
import { Fraunces, Outfit, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0B2E40',
}

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  display: 'swap',
  axes: ['SOFT', 'WONK', 'opsz'],
})

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
})

const mono = JetBrains_Mono({
  variable: '--font-mono-default',
  subsets: ['latin'],
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.imoauto.cv'
const SITE_TITLE = 'IMOAUTO — Imóveis e Automóveis em Cabo Verde'
const SITE_DESC =
  'Compra, vende e aluga casas, apartamentos, terrenos e automóveis em todas as ilhas de Cabo Verde — Praia, Mindelo, Sal, Boa Vista e mais. Anunciar é grátis.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: '%s · IMOAUTO' },
  description: SITE_DESC,
  applicationName: 'IMOAUTO',
  keywords: [
    'imóveis Cabo Verde', 'imobiliária Cabo Verde', 'casas Cabo Verde',
    'apartamentos Cabo Verde', 'terrenos Cabo Verde', 'comprar casa Cabo Verde',
    'alugar apartamento Cabo Verde', 'automóveis Cabo Verde', 'carros Cabo Verde',
    'IMOAUTO', 'imóveis Praia', 'imóveis Mindelo', 'imóveis Sal',
  ],
  openGraph: {
    type: 'website',
    siteName: 'IMOAUTO',
    locale: 'pt_PT',
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESC,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESC,
  },
}

const ORG_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'IMOAUTO',
  alternateName: 'ImoAuto',
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  description: SITE_DESC,
  areaServed: { '@type': 'Country', name: 'Cabo Verde' },
  email: 'afroberd@gmail.com',
}
const WEBSITE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'IMOAUTO',
  url: SITE_URL,
  inLanguage: 'pt',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/listings?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt"
      className={`${fraunces.variable} ${outfit.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSONLD) }}
        />
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  )
}
