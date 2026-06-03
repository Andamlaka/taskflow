'use client'

import { useState } from 'react'
import { Plus, LayoutDashboard, X } from 'lucide-react'
import { useWorkspaceContext } from '@/providers/WorkspaceProvider'
import { useWorkspaces } from '@/hooks/useWorkspaces'
import { useProjects } from '@/hooks/useProjects'
import { useCreateWorkspace, useCreateProject } from '@/hooks/useWorkspaceMutations'
import { ProjectCard } from '@/components/workspace/ProjectCard'
import { ErrorMessage } from '@/components/shared/ErrorMessage'

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-xl bg-popover p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-medium">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { activeWorkspaceId } = useWorkspaceContext()
  const { workspaces, isLoading: loadingWorkspaces, error: workspacesError } = useWorkspaces()
  const { projects, isLoading: loadingProjects, error: projectsError } = useProjects(activeWorkspaceId)

  const createWorkspace = useCreateWorkspace()
  const createProject = useCreateProject()

  const [wsName, setWsName] = useState('')
  const [projName, setProjName] = useState('')
  const [wsOpen, setWsOpen] = useState(false)
  const [projOpen, setProjOpen] = useState(false)

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId)

  const handleCreateWorkspace = async (e: { preventDefault(): void }) => {
    e.preventDefault()
    if (!wsName.trim()) return
    try {
      await createWorkspace.mutateAsync(wsName.trim())
      setWsName('')
      setWsOpen(false)
    } catch {
      // error handled by onError toast in the mutation
    }
  }

  const handleCreateProject = async (e: { preventDefault(): void }) => {
    e.preventDefault()
    if (!projName.trim() || !activeWorkspaceId) return
    try {
      await createProject.mutateAsync({ name: projName.trim(), workspaceId: activeWorkspaceId })
      setProjName('')
      setProjOpen(false)
    } catch {
      // error handled by onError toast in the mutation
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loadingWorkspaces) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (workspacesError) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <ErrorMessage message="Failed to load workspaces." />
      </div>
    )
  }

  // ── No workspaces ────────────────────────────────────────────────────────
  if (workspaces.length === 0) {
    return (
      <>
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <LayoutDashboard className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">No workspaces yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first workspace to get started
            </p>
          </div>
          <button
            onClick={() => setWsOpen(true)}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New workspace
          </button>
        </div>

        <Modal open={wsOpen} onClose={() => setWsOpen(false)} title="Create workspace">
          <form onSubmit={handleCreateWorkspace} className="flex flex-col gap-3">
            <input
              autoFocus
              placeholder="e.g. Acme Corp"
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={createWorkspace.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {createWorkspace.isPending ? 'Creating…' : 'Create workspace'}
            </button>
          </form>
        </Modal>
      </>
    )
  }

  // ── Main dashboard ────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {activeWorkspace?.name ?? 'Dashboard'}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </p>
          </div>
          <button
            onClick={() => setProjOpen(true)}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New project
          </button>
        </div>

        {loadingProjects ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl border bg-muted" />
            ))}
          </div>
        ) : projectsError ? (
          <ErrorMessage message="Failed to load projects." />
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
            <p className="text-sm text-muted-foreground">No projects in this workspace yet</p>
            <button
              onClick={() => setProjOpen(true)}
              className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
            >
              <Plus className="h-3.5 w-3.5" /> Add first project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      <Modal open={projOpen} onClose={() => setProjOpen(false)} title="Create project">
        <form onSubmit={handleCreateProject} className="flex flex-col gap-3">
          <input
            autoFocus
            placeholder="e.g. Website Redesign"
            value={projName}
            onChange={(e) => setProjName(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={createProject.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {createProject.isPending ? 'Creating…' : 'Create project'}
          </button>
        </form>
      </Modal>
    </>
  )
}
