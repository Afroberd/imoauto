import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCVE } from '@/lib/listings/constants'
import type { Listing, ListingPhoto } from '@/lib/listings/types'
import {
  PinIcon, BedIcon, BathIcon, AreaIcon,
  CalendarIcon, GaugeIcon, FuelIcon, HouseIcon, CarIcon,
} from '@/components/icons'
import { ShareButton } from '@/components/share-button'

function buildWhatsAppLink(phone: string, listingTitle: string): string {
  // Strip everything that's not a digit. Wa.me expects E.164 without `+`.
  const digits = phone.replace(/\D/g, '')
  const msg = `Olá, vi o teu anúncio no IMOAUTO: "${listingTitle}". Continua disponível?`
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`
}

export const dynamic = 'force-dynamic'

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!listing) notFound()
  const l = listing as Listing

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isOwner = user?.id === l.owner_id
  if (l.status !== 'published' && !isOwner) notFound()

  const { data: photoData } = await supabase
    .from('listing_photos')
    .select('*')
    .eq('listing_id', id)
    .order('position', { ascending: true })
  const photos = (photoData ?? []) as ListingPhoto[]

  const isProperty = l.kind === 'property'
  const isRent = l.purpose === 'rent'
  const hero = photos[0]
  const thumbs = photos.slice(1, 5)

  return (
    <main className="bg-paper">
      <div className="mx-auto max-w-6xl px-5 pt-8">
        <Link
          href="/listings"
          className="inline-flex items-center gap-1 text-[13px] text-text-3 transition-colors hover:text-ink"
        >
          ← Voltar aos anúncios
        </Link>
      </div>

      {/* Title block */}
      <header className="mx-auto mt-6 max-w-6xl px-5">
        <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.18em] text-text-3">
          <span>{isProperty ? 'Imóvel' : 'Automóvel'}</span>
          <span>·</span>
          <span className={isRent ? 'text-coral' : 'text-ink'}>
            {isRent ? 'Aluguer' : 'Venda'}
          </span>
        </div>
        <h1 className="mt-3 font-display text-[40px] font-medium leading-[1.04] tracking-[-0.022em] text-ink sm:text-[52px]">
          {l.title}
        </h1>
        <div className="mt-3 flex items-center gap-2 text-sm text-text-2">
          <PinIcon className="h-4 w-4 text-text-3" />
          <span>
            {l.location_island}
            {l.location_city ? `, ${l.location_city}` : ''}
          </span>
        </div>
      </header>

      {/* Gallery */}
      <section className="mx-auto mt-8 max-w-6xl px-5">
        <PhotoGallery hero={hero} thumbs={thumbs} kind={l.kind} />
      </section>

      {/* Body */}
      <section className="mx-auto mt-12 grid max-w-6xl gap-12 px-5 pb-20 md:grid-cols-[1.6fr_1fr]">
        {/* Left */}
        <div>
          {/* Highlights */}
          <Highlights listing={l} />

          {/* Description */}
          <div className="mt-12 border-t border-shell pt-10">
            <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.22em] text-text-3">
              <span className="numeral text-[14px] tnum">01</span>
              Sobre {isProperty ? 'o imóvel' : 'o automóvel'}
            </div>
            <p className="mt-4 whitespace-pre-wrap text-[16px] leading-relaxed text-text-1">
              {l.description || (
                <span className="italic text-text-3">Sem descrição adicional.</span>
              )}
            </p>
          </div>

          {/* Attributes */}
          <div className="mt-12 border-t border-shell pt-10">
            <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.22em] text-text-3">
              <span className="numeral text-[14px] tnum">02</span>
              Características
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              {isProperty ? (
                <>
                  <AttrRow label="Tipo" value={l.attributes.property_type} />
                  <AttrRow label="Área" value={l.attributes.area_sqm != null ? `${l.attributes.area_sqm} m²` : undefined} />
                  <AttrRow label="Quartos" value={l.attributes.bedrooms != null ? String(l.attributes.bedrooms) : undefined} />
                  <AttrRow label="Casas de banho" value={l.attributes.bathrooms != null ? String(l.attributes.bathrooms) : undefined} />
                </>
              ) : (
                <>
                  <AttrRow label="Tipo" value={l.attributes.vehicle_type} />
                  <AttrRow label="Marca" value={l.attributes.brand} />
                  <AttrRow label="Modelo" value={l.attributes.model} />
                  <AttrRow label="Ano" value={l.attributes.year != null ? String(l.attributes.year) : undefined} />
                  <AttrRow label="Quilometragem" value={l.attributes.km != null ? `${l.attributes.km.toLocaleString('pt-PT')} km` : undefined} />
                  <AttrRow label="Combustível" value={l.attributes.fuel} />
                  <AttrRow label="Caixa" value={l.attributes.transmission} />
                </>
              )}
            </dl>
          </div>
        </div>

        {/* Right — sticky contact */}
        <aside className="md:sticky md:top-24 md:self-start">
          <div className="rounded-[var(--radius-card)] border border-shell bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-display text-[32px] font-medium leading-none text-ink tnum">
                {formatCVE(l.price_cve)}
              </span>
              {isRent && <span className="text-sm text-text-3">/ aluguer</span>}
            </div>
            <div className="mt-4 flex items-center gap-2 text-[13px] text-text-2">
              {isProperty ? <HouseIcon className="h-4 w-4 text-text-3" /> : <CarIcon className="h-4 w-4 text-text-3" />}
              {isProperty ? 'Imóvel' : 'Automóvel'} · {isRent ? 'Aluguer' : 'Venda'}
            </div>

            {l.contact_phone ? (
              <a
                href={buildWhatsAppLink(l.contact_phone, l.title)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-deep"
              >
                <span aria-hidden>💬</span> Contactar via WhatsApp
              </a>
            ) : (
              <div className="mt-6 rounded-full border border-shell bg-paper-soft px-5 py-3 text-center text-[13px] text-text-3">
                Sem contacto disponível
              </div>
            )}
            <div className="mt-2">
              <ShareButton title={l.title} />
            </div>

            <p className="mt-4 text-[12px] leading-relaxed text-text-3">
              Contacto direto. Sem comissões intermédias do IMOAUTO.
            </p>
          </div>

          {isOwner && (
            <div className="mt-4 rounded-[var(--radius-card)] border border-warn/40 bg-warn-soft px-4 py-3 text-[13px] text-text-1">
              Este é o teu anúncio.{' '}
              <Link href="/my-listings" className="font-medium underline underline-offset-4 hover:text-ink">
                Ver na minha lista
              </Link>
              .
            </div>
          )}
        </aside>
      </section>
    </main>
  )
}

function PhotoGallery({
  hero,
  thumbs,
  kind,
}: {
  hero?: ListingPhoto
  thumbs: ListingPhoto[]
  kind: 'property' | 'vehicle'
}) {
  if (!hero) {
    return <GalleryPlaceholder kind={kind} />
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={hero.url}
        alt="Foto principal"
        className="aspect-[4/3] w-full rounded-[var(--radius-card)] object-cover"
      />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => {
          const t = thumbs[i]
          return t ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={t.id}
              src={t.url}
              alt={`Foto ${i + 2}`}
              className="aspect-square w-full rounded-[calc(var(--radius-card)/1.4)] object-cover"
            />
          ) : (
            <div
              key={i}
              className="aspect-square w-full rounded-[calc(var(--radius-card)/1.4)] border border-dashed border-shell bg-paper-soft"
            />
          )
        })}
      </div>
    </div>
  )
}

function GalleryPlaceholder({ kind }: { kind: 'property' | 'vehicle' }) {
  return (
    <div className="relative aspect-[16/8] overflow-hidden rounded-[var(--radius-card)] border border-shell bg-paper-soft bg-topo">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <span className="numeral text-[80px] text-coral tnum">{kind === 'property' ? '🏠' : '🚗'}</span>
          <p className="mt-2 text-sm uppercase tracking-[0.22em] text-text-3">
            Sem fotos ainda
          </p>
        </div>
      </div>
      <svg
        viewBox="0 0 600 80"
        className="absolute bottom-0 left-0 w-full"
        preserveAspectRatio="none"
      >
        <path d="M0,40 Q150,10 300,40 T600,40 L600,80 L0,80 Z" fill="#1E445C" opacity="0.92" />
        <path d="M0,55 Q150,30 300,55 T600,55 L600,80 L0,80 Z" fill="#0B2E40" />
      </svg>
    </div>
  )
}

function Highlights({ listing }: { listing: Listing }) {
  const a = listing.attributes
  const isProperty = listing.kind === 'property'
  const items: { icon: React.ReactNode; label: string; value: string }[] = []

  if (isProperty) {
    if (a.bedrooms != null) items.push({ icon: <BedIcon />, label: 'Quartos', value: String(a.bedrooms) })
    if (a.bathrooms != null) items.push({ icon: <BathIcon />, label: 'WC', value: String(a.bathrooms) })
    if (a.area_sqm != null) items.push({ icon: <AreaIcon />, label: 'Área', value: `${a.area_sqm} m²` })
  } else {
    if (a.year != null) items.push({ icon: <CalendarIcon />, label: 'Ano', value: String(a.year) })
    if (a.km != null) items.push({ icon: <GaugeIcon />, label: 'Km', value: a.km.toLocaleString('pt-PT') })
    if (a.fuel) items.push({ icon: <FuelIcon />, label: 'Combustível', value: a.fuel })
  }

  if (items.length === 0) return null

  return (
    <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[var(--radius-card)] border border-shell bg-shell">
      {items.map((it) => (
        <div key={it.label} className="bg-white px-4 py-5">
          <div className="text-ink-soft">{it.icon}</div>
          <div className="mt-2 font-display text-[22px] font-medium text-ink tnum">{it.value}</div>
          <div className="text-[12px] uppercase tracking-[0.15em] text-text-3">{it.label}</div>
        </div>
      ))}
    </div>
  )
}

function AttrRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-baseline justify-between border-b border-shell/70 py-2">
      <dt className="text-text-3">{label}</dt>
      <dd className="text-ink capitalize">{value}</dd>
    </div>
  )
}
