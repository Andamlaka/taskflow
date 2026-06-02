import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

// ─── Create Workspace ─────────────────────────────────────────────────────────

export function useCreateWorkspace() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (name: string): Promise<void> => {
      const { error } = await supabase
        .from('workspaces')
        .insert({ name })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      toast.success('Workspace created')
    },
    onError: () => {
      toast.error('Failed to create workspace')
    },
  })
}

// ─── Create Project ───────────────────────────────────────────────────────────

export function useCreateProject() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      name,
      workspaceId,
    }: {
      name: string
      workspaceId: string
    }): Promise<void> => {
      const { error } = await supabase
        .from('projects')
        .insert({ name, workspace_id: workspaceId })

      if (error) throw error
    },
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })
      toast.success('Project created')
    },
    onError: () => {
      toast.error('Failed to create project')
    },
  })
}
