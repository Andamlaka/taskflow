import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

type Workspace = Database['public']['Tables']['workspaces']['Row']

export function useWorkspaces(): {
  workspaces: Workspace[]
  isLoading: boolean
  error: Error | null
} {
  const supabase = createClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async (): Promise<Workspace[]> => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      return data
    },
  })

  return {
    workspaces: data ?? [],
    isLoading,
    error: error as Error | null,
  }
}
