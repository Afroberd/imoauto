import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard')

  return (
    <main className="bg-paper">
      <div className="mx-auto max-w-7xl px-5 py-8 md:py-12">
        <header className="mb-8">
          <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.22em] text-text-3">
            <span className="h-px w-8 bg-line-strong" />
            Painel de anfitrião
          </div>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-[-0.022em] text-ink sm:text-4xl">
            Dashboard
          </h1>
        </header>

        <div className="flex flex-col gap-8 md:flex-row">
          <DashboardSidebar />
          <section className="min-w-0 flex-1">{children}</section>
        </div>
      </div>
    </main>
  )
}
