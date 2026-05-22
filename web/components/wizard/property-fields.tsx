'use client'

import {
  PROPERTY_TYPES,
  PROPERTY_CONDITIONS,
  FURNISHED_OPTIONS,
  AMENITIES,
  HOUSE_RULES,
  UTILITIES,
  CANCELLATION_POLICIES,
  type ListingPurpose,
} from '@/lib/listings/constants'
import {
  NumberField, SelectField, ChipGroup, ToggleField, FieldGrid,
  type WizardData, type Setter,
} from './fields'

/** Step 3 — property details, adapting to the chosen purpose. */
export function PropertyFields({
  data, set, purpose,
}: {
  data: WizardData; set: Setter; purpose: ListingPurpose
}) {
  const daily = purpose === 'rent_daily'
  const monthly = purpose === 'rent_monthly'
  const rent = daily || monthly
  const sale = purpose === 'sale'

  return (
    <div className="space-y-5">
      <FieldGrid>
        <SelectField
          data={data} set={set} name="property_type" label="Tipo de imóvel"
          required options={PROPERTY_TYPES}
        />
        <NumberField
          data={data} set={set} name="area_sqm" label="Área" suffix="m²" min={0}
        />
      </FieldGrid>

      <FieldGrid>
        <NumberField data={data} set={set} name="bedrooms" label="Quartos" min={0} />
        <NumberField data={data} set={set} name="bathrooms" label="Casas de banho" min={0} />
      </FieldGrid>

      {/* rent_daily needs sleeping capacity */}
      {daily && (
        <FieldGrid>
          <NumberField data={data} set={set} name="beds" label="Camas" min={0} />
          <NumberField
            data={data} set={set} name="guests" label="Capacidade (hóspedes)" min={1}
          />
        </FieldGrid>
      )}

      {/* sale-specific */}
      {sale && (
        <FieldGrid>
          <SelectField
            data={data} set={set} name="property_condition"
            label="Estado de conservação" options={PROPERTY_CONDITIONS}
          />
          <NumberField
            data={data} set={set} name="year_built" label="Ano de construção"
            min={1900} max={2100}
          />
        </FieldGrid>
      )}

      {/* rent-specific: furnished */}
      {rent && (
        <SelectField
          data={data} set={set} name="furnished" label="Mobília"
          options={FURNISHED_OPTIONS}
        />
      )}

      {/* rent_monthly: utilities + contract */}
      {monthly && (
        <>
          <ChipGroup
            data={data} set={set} name="utilities_included"
            label="Despesas incluídas na renda" options={UTILITIES}
            hint="Marca o que já está incluído no valor mensal."
          />
          <FieldGrid>
            <NumberField
              data={data} set={set} name="min_contract_months"
              label="Duração mínima" suffix="meses" min={1}
            />
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium uppercase tracking-[0.12em] text-text-3">
                Disponível a partir de
              </label>
              <input
                type="date"
                value={(data.available_from as string) ?? ''}
                onChange={(e) => set('available_from', e.target.value)}
                className="w-full rounded-lg border border-shell bg-white px-4 py-2.5 text-[15px] text-text-1 outline-none focus:border-ink"
              />
            </div>
          </FieldGrid>
        </>
      )}

      {/* rent_daily: amenities + stay rules */}
      {daily && (
        <>
          <ChipGroup
            data={data} set={set} name="amenities" label="Comodidades"
            options={AMENITIES}
          />
          <FieldGrid>
            <NumberField
              data={data} set={set} name="min_nights" label="Estadia mínima"
              suffix="noites" min={1}
            />
            <NumberField
              data={data} set={set} name="max_nights" label="Estadia máxima"
              suffix="noites" min={1}
            />
          </FieldGrid>
          <FieldGrid>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium uppercase tracking-[0.12em] text-text-3">
                Check-in a partir de
              </label>
              <input
                type="time"
                value={(data.checkin_time as string) ?? ''}
                onChange={(e) => set('checkin_time', e.target.value)}
                className="w-full rounded-lg border border-shell bg-white px-4 py-2.5 text-[15px] text-text-1 outline-none focus:border-ink"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium uppercase tracking-[0.12em] text-text-3">
                Check-out até
              </label>
              <input
                type="time"
                value={(data.checkout_time as string) ?? ''}
                onChange={(e) => set('checkout_time', e.target.value)}
                className="w-full rounded-lg border border-shell bg-white px-4 py-2.5 text-[15px] text-text-1 outline-none focus:border-ink"
              />
            </div>
          </FieldGrid>
          <SelectField
            data={data} set={set} name="cancellation" label="Política de cancelamento"
            options={CANCELLATION_POLICIES}
          />
        </>
      )}

      {/* rent: house rules */}
      {rent && (
        <ChipGroup
          data={data} set={set} name="rules" label="Regras da casa"
          options={HOUSE_RULES}
        />
      )}

      <ToggleField
        data={data} set={set} name="has_garage"
        label="Tem garagem / estacionamento próprio"
      />
    </div>
  )
}
