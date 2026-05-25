import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import {
  formatCVE, isRent, purposeLabel, priceSuffix, labelOf,
  PROPERTY_TYPES, VEHICLE_TYPES, FUEL_TYPES, TRANSMISSION_TYPES,
  PROPERTY_CONDITIONS, VEHICLE_CONDITIONS, FURNISHED_OPTIONS,
  AMENITIES, HOUSE_RULES, UTILITIES, VEHICLE_EXTRAS, DELIVERY_OPTIONS,
  CANCELLATION_POLICIES,
} from '@/lib/listings/constants'
import type { Listing, ListingPhoto, ListingAttributes } from '@/lib/listings/types'
import {
  PinIcon, BedIcon, BathIcon, AreaIcon,
  CalendarIcon, GaugeIcon, FuelIcon, HouseIcon, CarIcon,
} from '@/components/icons'
import { ShareButton } from '@/components/share-button'
import { FavoriteButton } from '@/components/favorite-button'
import { ContactSellerButton } from '@/components/contact-seller-button'
import { BookingForm } from '@/components/booking-form'
import { ReviewForm } from '@/components/review-form'
import { StarRatingDisplay } from '@/components/star-rating'
import { getUnavailableRanges } from '@/app/actions/bookings'
import { checkReviewEligibility } from '@/app/actions/reviews'

function buildWhatsAppLink(phone: string, listingTitle: string): string {
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

  // Check if the logged-in (non-owner) user has favorited this listing.
  let isFavorited = false
  if (user && !isOwner) {
    const { data: fav } = await supabase
      .from('favorites')
      .select('listing_id')
      .eq('user_id', user.id)
      .eq('listing_id', id)
      .maybeSingle()
    isFavorited = !!fav
  }

  const { data: photoData } = await supabase
    .from('listing_photos')
    .select('*')
    .eq('listing_id', id)
    .order('position', { ascending: true })
  const photos = (photoData ?? []) as ListingPhoto[]

  const isProperty = l.kind === 'property'
  const rent = isRent(l.purpose)
  const a = l.attributes ?? {}
  const hero = photos[0]
  const thumbs = photos.slice(1, 5)
  const rows = detailRows(l)

  // Phase 5.3: load unavailable date ranges (only for rent_daily)
  const unavailable =
    l.purpose === 'rent_daily' ? await getUnavailableRanges(l.id) : []

  // Phase 5.4: reviews — list + eligibility
  const [{ data: reviewData }, eligibility] = await Promise.all([
    supabase
      .from('reviews')
      .select('id, reviewer_id, rating, body, created_at, reviewer:profiles(display_name, email)')
      .eq('listing_id', l.id)
      .order('created_at', { ascending: false })
      .limit(20),
    checkReviewEligibility(l.id),
  ])
  const reviews = (reviewData ?? []) as unknown as {
    id: string
    reviewer_id: string
    rating: number
    body: string | null
    created_at: string
    reviewer: { display_name: string | null; email: string } | null
  }[]

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
          <span className={rent ? 'text-coral' : 'text-ink'}>{purposeLabel(l.purpose)}</span>
          {a.negotiable && (
            <>
              <span>·</span>
              <span className="text-ink">Negociável</span>
            </>
          )}
        </div>
        <div className="mt-3 flex items-start justify-between gap-4">
          <h1 className="font-display text-[40px] font-medium leading-[1.04] tracking-[-0.022em] text-ink sm:text-[52px]">
            {l.title}
          </h1>
          {!isOwner && (
            <FavoriteButton
              listingId={l.id}
              initialFavorited={isFavorited}
              className="mt-2 flex-shrink-0"
            />
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-2">
          <span className="inline-flex items-center gap-2">
            <PinIcon className="h-4 w-4 text-text-3" />
            <span>
              {l.location_municipality
                ? `${l.location_municipality}, ${l.location_island}`
                : l.location_island}
              {l.location_city ? ` · ${l.location_city}` : ''}
            </span>
          </span>
          {l.rating_count > 0 && (
            <StarRatingDisplay value={l.rating_avg} count={l.rating_count} size="md" />
          )}
        </div>
      </header>

      {/* Gallery */}
      <section className="mx-auto mt-8 max-w-6xl px-5">
        <PhotoGallery hero={hero} thumbs={thumbs} kind={l.kind} />
      </section>

      {/* Body */}
      <section className="mx-auto mt-12 grid max-w-6xl gap-12 px-5 pb-20 md:grid-cols-[1.6fr_1fr]">
        <div>
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
          {rows.length > 0 && (
            <div className="mt-12 border-t border-shell pt-10">
              <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.22em] text-text-3">
                <span className="numeral text-[14px] tnum">02</span>
                Características
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                {rows.map((r) => (
                  <div
                    key={r.label}
                    className="flex items-baseline justify-between gap-2 border-b border-shell/70 py-2"
                  >
                    <dt className="text-text-3">{r.label}</dt>
                    <dd className="text-right text-ink">{r.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Chips: amenities / rules / extras */}
          <ChipSection listing={l} />

          {/* Reviews */}
          <div className="mt-12 border-t border-shell pt-10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.22em] text-text-3">
                <span className="numeral text-[14px] tnum">{l.purpose === 'rent_daily' ? '03' : '03'}</span>
                Avaliações
              </div>
              {l.rating_count > 0 && (
                <StarRatingDisplay value={l.rating_avg} count={l.rating_count} size="md" />
              )}
            </div>

            {reviews.length === 0 ? (
              <p className="mt-4 text-sm italic text-text-3">Ainda sem avaliações.</p>
            ) : (
              <ul className="mt-6 space-y-5">
                {reviews.map((r) => (
                  <li key={r.id} className="rounded-[var(--radius-card)] border border-shell bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[13px] font-medium text-ink">
                        {r.reviewer?.display_name ||
                          (r.reviewer?.email ? r.reviewer.email.split('@')[0] : 'Anónimo')}
                      </p>
                      <StarRatingDisplay value={r.rating} size="sm" />
                    </div>
                    {r.body && (
                      <p className="mt-2 text-[14px] leading-relaxed text-text-1">{r.body}</p>
                    )}
                    <p className="mt-2 text-[11px] text-text-3 tnum">
                      {new Date(r.created_at).toLocaleDateString('pt-PT')}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {/* Review form */}
            {!isOwner && eligibility.eligible && (
              <div className="mt-6">
                <ReviewForm listingId={l.id} existing={eligibility.existingReview} />
              </div>
            )}
            {!isOwner && !eligibility.eligible && eligibility.reason === 'no_interaction' && (
              <p className="mt-4 text-[12px] text-text-3">
                Contacta o anunciante ou faz uma reserva para poderes avaliar.
              </p>
            )}
          </div>
        </div>

        {/* Right — sticky contact */}
        <aside className="md:sticky md:top-24 md:self-start">
          <div className="rounded-[var(--radius-card)] border border-shell bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-[32px] font-medium leading-none text-ink tnum">
                {formatCVE(l.price_cve)}
              </span>
              {priceSuffix(l.purpose) && (
                <span className="text-sm text-text-3">{priceSuffix(l.purpose)}</span>
              )}
            </div>

            {/* Secondary prices */}
            <dl className="mt-3 space-y-1 text-[13px]">
              {a.price_weekly_cve != null && (
                <PriceLine label="Por semana" value={formatCVE(a.price_weekly_cve)} />
              )}
              {a.cleaning_fee_cve != null && (
                <PriceLine label="Taxa de limpeza" value={formatCVE(a.cleaning_fee_cve)} />
              )}
              {a.deposit_cve != null && (
                <PriceLine label="Caução" value={formatCVE(a.deposit_cve)} />
              )}
            </dl>

            <div className="mt-4 flex items-center gap-2 text-[13px] text-text-2">
              {isProperty ? <HouseIcon className="h-4 w-4 text-text-3" /> : <CarIcon className="h-4 w-4 text-text-3" />}
              {isProperty ? 'Imóvel' : 'Automóvel'} · {purposeLabel(l.purpose)}
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
            {!isOwner && <ContactSellerButton listingId={l.id} />}

            <div className="mt-2">
              <ShareButton title={l.title} />
            </div>

            <p className="mt-4 text-[12px] leading-relaxed text-text-3">
              Contacto direto. Sem comissões intermédias do IMOAUTO.
            </p>
          </div>

          {/* Booking form — rent_daily only, non-owners only */}
          {l.purpose === 'rent_daily' && !isOwner && (
            <div className="mt-4">
              <BookingForm
                listingId={l.id}
                pricePerNight={l.price_cve}
                cleaningFee={a.cleaning_fee_cve ?? 0}
                minNights={a.min_nights ?? 1}
                maxNights={a.max_nights}
                maxGuests={a.guests}
                unavailable={unavailable}
              />
            </div>
          )}

          {/* Owner panel for managing this listing's bookings */}
          {l.purpose === 'rent_daily' && isOwner && (
            <div className="mt-4 rounded-[var(--radius-card)] border border-shell bg-white p-4 shadow-[var(--shadow-card)]">
              <p className="text-[12px] uppercase tracking-[0.18em] text-text-3">Reservas</p>
              <Link
                href="/bookings?view=owner"
                className="mt-2 inline-block rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-paper transition-colors hover:bg-ink-deep"
              >
                Ver pedidos recebidos
              </Link>
            </div>
          )}

          {isOwner && (
            <div className="mt-4 rounded-[var(--radius-card)] border border-warn/40 bg-warn-soft p-4">
              <p className="text-[13px] text-text-1">Este é o teu anúncio.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/listings/${l.id}/edit`}
                  className="rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-paper transition-colors hover:bg-ink-deep"
                >
                  Editar
                </Link>
                <Link
                  href={`/listings/${l.id}/settings`}
                  className="rounded-full border border-shell bg-white px-4 py-2 text-[13px] text-text-2 transition-colors hover:border-ink hover:text-ink"
                >
                  Definições
                </Link>
                <Link
                  href="/my-listings"
                  className="rounded-full border border-shell bg-white px-4 py-2 text-[13px] text-text-2 transition-colors hover:border-ink hover:text-ink"
                >
                  Os meus anúncios
                </Link>
              </div>
            </div>
          )}
        </aside>
      </section>
    </main>
  )
}

/* — Build the attribute rows relevant to this listing's kind + purpose — */
function detailRows(l: Listing): { label: string; value: string }[] {
  const a: ListingAttributes = l.attributes ?? {}
  const rows: { label: string; value: string }[] = []
  const push = (label: string, value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return
    rows.push({ label, value: String(value) })
  }
  const daily = l.purpose === 'rent_daily'
  const monthly = l.purpose === 'rent_monthly'
  const sale = l.purpose === 'sale'

  if (l.kind === 'property') {
    push('Tipo', labelOf(PROPERTY_TYPES, a.property_type))
    push('Área', a.area_sqm != null ? `${a.area_sqm} m²` : undefined)
    push('Quartos', a.bedrooms)
    push('Casas de banho', a.bathrooms)
    if (daily) {
      push('Camas', a.beds)
      push('Capacidade', a.guests != null ? `${a.guests} hóspedes` : undefined)
      push('Estadia mínima', a.min_nights != null ? `${a.min_nights} noites` : undefined)
      push('Estadia máxima', a.max_nights != null ? `${a.max_nights} noites` : undefined)
      push('Check-in', a.checkin_time)
      push('Check-out', a.checkout_time)
      push('Cancelamento', labelOf(CANCELLATION_POLICIES, a.cancellation))
    }
    if (monthly) {
      push('Mobília', labelOf(FURNISHED_OPTIONS, a.furnished))
      push('Duração mínima', a.min_contract_months != null ? `${a.min_contract_months} meses` : undefined)
      push('Disponível desde', a.available_from)
    }
    if (sale) {
      push('Estado', labelOf(PROPERTY_CONDITIONS, a.property_condition))
      push('Ano de construção', a.year_built)
    }
    push('Garagem', a.has_garage ? 'Sim' : undefined)
  } else {
    push('Tipo', labelOf(VEHICLE_TYPES, a.vehicle_type))
    push('Marca', a.brand)
    push('Modelo', a.model)
    push('Ano', a.year)
    if (sale) push('Quilometragem', a.km != null ? `${a.km.toLocaleString('pt-PT')} km` : undefined)
    push('Combustível', labelOf(FUEL_TYPES, a.fuel))
    push('Caixa', labelOf(TRANSMISSION_TYPES, a.transmission))
    push('Lugares', a.seats)
    push('Portas', a.doors)
    push('Cor', a.color)
    if (sale) {
      push('Estado', labelOf(VEHICLE_CONDITIONS, a.vehicle_condition))
      push('Documentos', a.docs_ok ? 'Em dia' : undefined)
    }
    if (!sale) {
      push('Idade mín. condutor', a.min_driver_age != null ? `${a.min_driver_age} anos` : undefined)
      push('KM incluídos / dia', a.daily_km_included != null ? `${a.daily_km_included} km` : 'Ilimitado')
      push('Seguro', a.insurance_included ? 'Incluído' : undefined)
    }
  }
  return rows
}

/* — Chip sections: amenities, house rules, vehicle extras, utilities, delivery — */
function ChipSection({ listing }: { listing: Listing }) {
  const a = listing.attributes ?? {}
  const groups: { title: string; values: string[]; options: readonly { value: string; label: string }[] }[] = []

  if (a.amenities?.length) groups.push({ title: 'Comodidades', values: a.amenities, options: AMENITIES })
  if (a.rules?.length) groups.push({ title: 'Regras', values: a.rules, options: HOUSE_RULES })
  if (a.utilities_included?.length) groups.push({ title: 'Incluído na renda', values: a.utilities_included, options: UTILITIES })
  if (a.vehicle_extras?.length) groups.push({ title: 'Extras', values: a.vehicle_extras, options: VEHICLE_EXTRAS })
  if (a.delivery_options?.length) groups.push({ title: 'Entrega', values: a.delivery_options, options: DELIVERY_OPTIONS })

  if (groups.length === 0) return null

  return (
    <div className="mt-10 space-y-6">
      {groups.map((g) => (
        <div key={g.title}>
          <h3 className="text-[12px] font-medium uppercase tracking-[0.15em] text-text-3">
            {g.title}
          </h3>
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {g.values.map((v) => (
              <li
                key={v}
                className="rounded-full border border-shell bg-paper-soft px-3 py-1 text-[13px] text-ink"
              >
                {labelOf(g.options, v)}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function PriceLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-text-3">{label}</dt>
      <dd className="text-text-1 tnum">{value}</dd>
    </div>
  )
}

function PhotoGallery({
  hero, thumbs, kind,
}: {
  hero?: ListingPhoto; thumbs: ListingPhoto[]; kind: 'property' | 'vehicle'
}) {
  if (!hero) return <GalleryPlaceholder kind={kind} />
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-card)]">
        <Image
          src={hero.url}
          alt="Foto principal"
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => {
          const t = thumbs[i]
          return t ? (
            <div
              key={t.id}
              className="relative aspect-square w-full overflow-hidden rounded-[calc(var(--radius-card)/1.4)]"
            >
              <Image
                src={t.url}
                alt={`Foto ${i + 2}`}
                fill
                unoptimized
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
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
        <div className="text-center text-ink-soft">
          {kind === 'property' ? <HouseIcon className="mx-auto h-12 w-12" /> : <CarIcon className="mx-auto h-12 w-12" />}
          <p className="mt-2 text-sm uppercase tracking-[0.22em] text-text-3">Sem fotos ainda</p>
        </div>
      </div>
      <svg viewBox="0 0 600 80" className="absolute bottom-0 left-0 w-full" preserveAspectRatio="none">
        <path d="M0,40 Q150,10 300,40 T600,40 L600,80 L0,80 Z" fill="#1E445C" opacity="0.92" />
        <path d="M0,55 Q150,30 300,55 T600,55 L600,80 L0,80 Z" fill="#0B2E40" />
      </svg>
    </div>
  )
}

function Highlights({ listing }: { listing: Listing }) {
  const a = listing.attributes ?? {}
  const isProperty = listing.kind === 'property'
  const daily = listing.purpose === 'rent_daily'
  const items: { icon: React.ReactNode; label: string; value: string }[] = []

  if (isProperty) {
    if (daily && a.guests != null)
      items.push({ icon: <BedIcon />, label: 'Hóspedes', value: String(a.guests) })
    if (a.bedrooms != null)
      items.push({ icon: <BedIcon />, label: 'Quartos', value: String(a.bedrooms) })
    if (a.bathrooms != null)
      items.push({ icon: <BathIcon />, label: 'WC', value: String(a.bathrooms) })
    if (a.area_sqm != null)
      items.push({ icon: <AreaIcon />, label: 'Área', value: `${a.area_sqm} m²` })
  } else {
    if (a.year != null) items.push({ icon: <CalendarIcon />, label: 'Ano', value: String(a.year) })
    if (a.km != null) items.push({ icon: <GaugeIcon />, label: 'Km', value: a.km.toLocaleString('pt-PT') })
    if (a.fuel) items.push({ icon: <FuelIcon />, label: 'Combustível', value: labelOf(FUEL_TYPES, a.fuel) })
  }

  if (items.length === 0) return null

  return (
    <div className={`grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-shell bg-shell ${
      items.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'
    }`}>
      {items.slice(0, 4).map((it) => (
        <div key={it.label} className="bg-white px-4 py-5">
          <div className="text-ink-soft">{it.icon}</div>
          <div className="mt-2 font-display text-[22px] font-medium text-ink tnum">{it.value}</div>
          <div className="text-[12px] uppercase tracking-[0.15em] text-text-3">{it.label}</div>
        </div>
      ))}
    </div>
  )
}
