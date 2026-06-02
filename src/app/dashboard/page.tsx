import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {user.user_metadata.full_name ?? user.email}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Dashboard coming soon…
        </p>
      </div>
    </div>
  )
}
