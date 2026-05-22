'use client'

import {
  VEHICLE_TYPES,
  VEHICLE_CONDITIONS,
  FUEL_TYPES,
  TRANSMISSION_TYPES,
  VEHICLE_EXTRAS,
  DELIVERY_OPTIONS,
  type ListingPurpose,
} from '@/lib/listings/constants'
import {
  TextField, NumberField, SelectField, ChipGroup, ToggleField, FieldGrid,
  type WizardData, type Setter,
} from './fields'

/** Step 3 — vehicle details, adapting to the chosen purpose. */
export function VehicleFields({
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
          data={data} set={set} name="vehicle_type" label="Tipo de veículo"
          required options={VEHICLE_TYPES}
        />
        <NumberField
          data={data} set={set} name="year" label="Ano" min={1900} max={2100}
        />
      </FieldGrid>

      <FieldGrid>
        <TextField data={data} set={set} name="brand" label="Marca" placeholder="Toyota, Hyundai…" />
        <TextField data={data} set={set} name="model" label="Modelo" placeholder="Corolla, Tucson…" />
      </FieldGrid>

      <FieldGrid>
        <SelectField data={data} set={set} name="fuel" label="Combustível" options={FUEL_TYPES} />
        <SelectField data={data} set={set} name="transmission" label="Caixa" options={TRANSMISSION_TYPES} />
      </FieldGrid>

      <FieldGrid>
        <NumberField data={data} set={set} name="seats" label="Lugares" min={1} />
        <NumberField data={data} set={set} name="doors" label="Portas" min={0} />
      </FieldGrid>

      <FieldGrid>
        <TextField data={data} set={set} name="color" label="Cor" placeholder="Branco, preto…" />
        {sale && (
          <NumberField
            data={data} set={set} name="km" label="Quilometragem" suffix="km" min={0}
          />
        )}
      </FieldGrid>

      {/* sale-specific */}
      {sale && (
        <>
          <SelectField
            data={data} set={set} name="vehicle_condition" label="Estado"
            options={VEHICLE_CONDITIONS}
          />
          <ToggleField
            data={data} set={set} name="docs_ok"
            label="Documentos em dia"
            hint="Registo, seguro e inspeção válidos."
          />
        </>
      )}

      {/* rent-specific (daily + monthly) */}
      {rent && (
        <>
          <ChipGroup
            data={data} set={set} name="vehicle_extras" label="Extras do veículo"
            options={VEHICLE_EXTRAS}
          />
          <FieldGrid>
            <NumberField
              data={data} set={set} name="min_driver_age"
              label="Idade mínima do condutor" suffix="anos" min={18}
            />
            <NumberField
              data={data} set={set} name="daily_km_included"
              label="KM incluídos / dia" min={0}
              hint="Deixa vazio para quilometragem ilimitada."
            />
          </FieldGrid>
          <ToggleField
            data={data} set={set} name="insurance_included"
            label="Seguro incluído no preço"
          />
        </>
      )}

      {/* rent_daily: delivery options */}
      {daily && (
        <ChipGroup
          data={data} set={set} name="delivery_options" label="Opções de entrega"
          options={DELIVERY_OPTIONS}
        />
      )}
    </div>
  )
}
