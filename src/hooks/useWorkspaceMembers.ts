import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface WorkspaceMember {
  workspace_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
  full_name: string | null
  email: string
}

export function useWorkspaceMembers(workspaceId: string | null): {
  members: WorkspaceMember[]
  isLoading: boolean
  error: Error | null
} {
  const supabase = createClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['workspace_members', workspaceId],
    queryFn: async (): Promise<WorkspaceMember[]> => {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('workspace_id, user_id, role, joined_at')
        .eq('workspace_id', workspaceId!)

      if (error) throw error

      const memberIds = data.map((m) => m.user_id)

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', memberIds)

      if (profilesError) {
        return data.map((m) => ({
          ...m,
          full_name: null,
          email: m.user_id,
        }))
      }

      return data.map((m) => {
        const profile = profiles.find((p) => p.id === m.user_id)
        return {
          ...m,
          full_name: profile?.full_name ?? null,
          email: profile?.email ?? m.user_id,
        }
      })
    },
    enabled: !!workspaceId,
  })

  return {
    members: data ?? [],
    isLoading,
    error: error as Error | null,
  }
}
