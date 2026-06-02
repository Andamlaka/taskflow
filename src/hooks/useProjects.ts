import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

type Project = Database['public']['Tables']['projects']['Row']

export function useProjects(workspaceId: string | null): {
  projects: Project[]
  isLoading: boolean
  error: Error | null
} {
  const supabase = createClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!workspaceId,
  })

  return {
    projects: data ?? [],
    isLoading,
    error: error as Error | null,
  }
}
