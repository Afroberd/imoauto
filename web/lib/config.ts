// Feature flags. Server-side only (no NEXT_PUBLIC_ prefix) — read where needed
// and pass down to client components as props.

// Daily rentals (aluguer diário) = the whole booking + payment + verification
// product. OFF at launch: the code and data stay intact, but the feature is
// hidden from the public (can't browse, search, create, or book daily rentals).
// Turn back on later by setting DAILY_RENTALS=true in Vercel env vars.
export const DAILY_RENTALS_ENABLED = process.env.DAILY_RENTALS === 'true'
