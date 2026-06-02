import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WorkspaceProvider } from '@/providers/WorkspaceProvider'
import { Sidebar } from '@/components/layout/Sidebar'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <NuqsAdapter>
      <WorkspaceProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-background p-6">
            {children}
          </main>
        </div>
      </WorkspaceProvider>
    </NuqsAdapter>
  )
}
