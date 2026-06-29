import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.imoauto.cv'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    '',
    '/listings',
    '/listings?kind=property',
    '/listings?kind=vehicle',
    '/listings/new',
    '/termos',
    '/privacidade',
    '/contacto',
  ].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: new Date(),
    changeFrequency: p === '' ? 'daily' : 'weekly',
    priority: p === '' ? 1 : 0.5,
  }))

  // Published listings — read with the anon client (published rows are public).
  let listingPages: MetadataRoute.Sitemap = []
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    )
    const { data } = await supabase
      .from('listings')
      .select('id, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(2000)
    listingPages = (data ?? []).map((l: { id: string; created_at: string | null }) => ({
      url: `${SITE_URL}/listings/${l.id}`,
      lastModified: l.created_at ? new Date(l.created_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))
  } catch {
    // If the DB is unreachable at build/request time, still return static pages.
  }

  return [...staticPages, ...listingPages]
}
