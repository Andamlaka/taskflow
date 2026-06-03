'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FolderKanban, LogOut, ChevronDown, CheckSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaces } from '@/hooks/useWorkspaces'
import { useProjects } from '@/hooks/useProjects'
import { useWorkspaceContext } from '@/providers/WorkspaceProvider'
import { toast } from 'sonner'

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const { activeWorkspaceId, setActiveWorkspaceId } = useWorkspaceContext()
  const { workspaces, isLoading: loadingWorkspaces } = useWorkspaces()
  const { projects } = useProjects(activeWorkspaceId)

  // Auto-select first workspace on load
  useEffect(() => {
    if (!activeWorkspaceId && workspaces.length > 0) {
      setActiveWorkspaceId(workspaces[0].id)
    }
  }, [workspaces, activeWorkspaceId, setActiveWorkspaceId])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-card px-3 py-4">

      {/* App name */}
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/25">
          <CheckSquare className="h-4 w-4" />
        </div>
        <span className="text-lg font-semibold tracking-tight">Taskflow</span>
      </div>

      {/* Workspace switcher */}
      <div className="mb-4">
        <p className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>
        {loadingWorkspaces ? (
          <div className="h-9 animate-pulse rounded-md bg-muted" />
        ) : (
          <div className="relative">
            <select
              value={activeWorkspaceId ?? ''}
              onChange={(e) => setActiveWorkspaceId(e.target.value)}
              className="w-full appearance-none rounded-lg border bg-background px-3 py-2 pr-8 text-sm font-medium outline-none transition-colors hover:bg-accent/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-0.5">
        <p className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Navigation
        </p>

        <Link
          href="/dashboard"
          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
            pathname === '/dashboard'
              ? 'bg-accent font-medium text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Overview
        </Link>

        {/* Projects list */}
        {projects.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Projects
            </p>
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                  pathname === `/dashboard/projects/${project.id}`
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                }`}
              >
                <FolderKanban className="h-4 w-4 shrink-0" />
                <span className="truncate">{project.name}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Sign out — pinned to bottom */}
      <div className="mt-auto border-t pt-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
