import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'

export const metadata = { robots: { index: false, follow: false } }

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard')

  return (
    <main className="bg-paper">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8 md:py-12">
        <header className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-text-3 sm:text-[12px] sm:tracking-[0.22em]">
            <span className="h-px w-6 bg-line-strong sm:w-8" />
            Painel de anfitrião
          </div>
          <h1 className="mt-2 font-display text-2xl font-medium tracking-[-0.022em] text-ink sm:text-3xl md:text-4xl">
            Dashboard
          </h1>
        </header>

        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          <DashboardSidebar />
          <section className="min-w-0 flex-1">{children}</section>
        </div>
      </div>
    </main>
  )
}
