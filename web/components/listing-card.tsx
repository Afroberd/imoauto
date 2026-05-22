import Link from 'next/link'
import Image from 'next/image'
import { formatCVE, isRent, purposeShort, priceSuffix } from '@/lib/listings/constants'
import type { Listing } from '@/lib/listings/types'
import {
  PinIcon, BedIcon, BathIcon, AreaIcon,
  CalendarIcon, GaugeIcon, FuelIcon,
} from '@/components/icons'

export function ListingCard({ listing }: { listing: Listing }) {
  const isProperty = listing.kind === 'property'
  const rent = isRent(listing.purpose)
  const suffix = priceSuffix(listing.purpose)
  const a = listing.attributes

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group relative block overflow-hidden rounded-[var(--radius-card)] border border-shell bg-white shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-paper-soft">
        {listing.cover_image_url ? (
          <Image
            src={listing.cover_image_url}
            alt={listing.title}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="photo-hover object-cover"
          />
        ) : (
          <PlaceholderArt kind={listing.kind} />
        )}

        {/* Purpose badge */}
        <span
          className={`absolute left-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] ${
            rent ? 'bg-coral text-white' : 'bg-ink text-paper'
          }`}
        >
          {rent ? `Aluguer · ${purposeShort(listing.purpose)}` : 'Venda'}
        </span>

        {/* Kind chip — small, in corner */}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-sky-soft px-2.5 py-1 text-[11px] font-medium text-ink shadow-sm ring-1 ring-ink/10">
          <span className="h-1.5 w-1.5 rounded-full bg-sky" />
          {isProperty ? 'Imóvel' : 'Automóvel'}
        </span>
      </div>

      <div className="space-y-2.5 px-4 pb-4 pt-4">
        <div className="flex items-center gap-1.5 text-[12px] text-text-3">
          <PinIcon className="h-3.5 w-3.5 text-text-3" />
          <span>
            {listing.location_municipality
              ? `${listing.location_municipality}, ${listing.location_island}`
              : listing.location_island}
            {listing.location_city ? ` · ${listing.location_city}` : ''}
          </span>
        </div>

        <h3 className="font-display text-[19px] leading-[1.15] tracking-[-0.015em] text-text-1 line-clamp-2">
          {listing.title}
        </h3>

        <div className="flex items-end justify-between pt-1">
          <div>
            <span className="font-display text-[22px] font-medium text-ink tnum">
              {formatCVE(listing.price_cve)}
            </span>
            {suffix && (
              <span className="ml-1 text-[12px] text-text-3">{suffix}</span>
            )}
          </div>
        </div>

        <ul className="flex flex-wrap gap-x-3.5 gap-y-1 pt-1 text-[12px] text-text-2">
          {isProperty ? (
            <>
              {a.bedrooms != null && (
                <Spec icon={<BedIcon className="h-3.5 w-3.5" />} value={`${a.bedrooms} quartos`} />
              )}
              {a.bathrooms != null && (
                <Spec icon={<BathIcon className="h-3.5 w-3.5" />} value={`${a.bathrooms} WC`} />
              )}
              {a.area_sqm != null && (
                <Spec icon={<AreaIcon className="h-3.5 w-3.5" />} value={`${a.area_sqm} m²`} />
              )}
            </>
          ) : (
            <>
              {a.year != null && (
                <Spec icon={<CalendarIcon className="h-3.5 w-3.5" />} value={String(a.year)} />
              )}
              {a.km != null && (
                <Spec
                  icon={<GaugeIcon className="h-3.5 w-3.5" />}
                  value={`${a.km.toLocaleString('pt-PT')} km`}
                />
              )}
              {a.fuel && (
                <Spec icon={<FuelIcon className="h-3.5 w-3.5" />} value={a.fuel} />
              )}
            </>
          )}
        </ul>
      </div>
    </Link>
  )
}

function Spec({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span className="text-text-3">{icon}</span>
      <span className="capitalize tnum">{value}</span>
    </li>
  )
}

function PlaceholderArt({ kind }: { kind: 'property' | 'vehicle' }) {
  return (
    <div className="bg-topo absolute inset-0 flex items-end justify-center bg-paper-soft">
      {kind === 'property' ? (
        <svg viewBox="0 0 240 180" className="h-full w-full" preserveAspectRatio="xMidYMax meet">
          <defs>
            <linearGradient id="sky-prop" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#F4EFE3" />
              <stop offset="100%" stopColor="#E5DCC4" />
            </linearGradient>
          </defs>
          <rect width="240" height="180" fill="url(#sky-prop)" />
          <circle cx="200" cy="40" r="14" fill="#E76B4F" opacity="0.85" />
          {/* island silhouettes */}
          <path d="M0,140 Q40,110 80,130 T160,125 T240,135 L240,180 L0,180 Z" fill="#1E445C" />
          <path d="M0,150 Q60,128 130,144 T240,150 L240,180 L0,180 Z" fill="#0B2E40" />
          {/* simple house */}
          <g fill="#FAF7F0" opacity="0.9">
            <path d="M110,125 L130,108 L150,125 L150,150 L110,150 Z" />
            <rect x="124" y="135" width="10" height="15" fill="#0B2E40" />
          </g>
        </svg>
      ) : (
        <svg viewBox="0 0 240 180" className="h-full w-full" preserveAspectRatio="xMidYMax meet">
          <defs>
            <linearGradient id="sky-veh" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#F4EFE3" />
              <stop offset="100%" stopColor="#E5DCC4" />
            </linearGradient>
          </defs>
          <rect width="240" height="180" fill="url(#sky-veh)" />
          <circle cx="40" cy="38" r="12" fill="#E76B4F" opacity="0.85" />
          <path d="M0,135 L240,135 L240,180 L0,180 Z" fill="#1E445C" />
          {/* car silhouette */}
          <g fill="#0B2E40">
            <path d="M70,128 L82,112 L150,112 L168,128 L185,128 L185,142 L55,142 L55,128 Z" />
            <circle cx="80" cy="146" r="8" fill="#061C29" />
            <circle cx="160" cy="146" r="8" fill="#061C29" />
            <rect x="88" y="116" width="20" height="14" fill="#E5DCC4" />
            <rect x="114" y="116" width="32" height="14" fill="#E5DCC4" />
          </g>
        </svg>
      )}
    </div>
  )
}
