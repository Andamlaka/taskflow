import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

type Task = Database['public']['Tables']['tasks']['Row']

export function useTasks(projectId: string | null): {
  tasks: Task[]
  isLoading: boolean
  error: Error | null
} {
  const supabase = createClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!projectId,
  })

  return {
    tasks: data ?? [],
    isLoading,
    error: error as Error | null,
  }
}
