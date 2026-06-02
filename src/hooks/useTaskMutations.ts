import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Database } from '@/types/supabase'

type Task = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

// ─── Create ───────────────────────────────────────────────────────────────────

export function useCreateTask() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newTask: TaskInsert): Promise<void> => {
      const { error } = await supabase
        .from('tasks')
        .insert(newTask)

      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.project_id] })
      toast.success('Task created')
    },
    onError: () => {
      toast.error('Failed to create task')
    },
  })
}

// ─── Update (with optimistic UI) ──────────────────────────────────────────────

export function useUpdateTask() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      projectId,
      ...update
    }: TaskUpdate & { id: string; projectId: string }): Promise<Task> => {
      const { data, error } = await supabase
        .from('tasks')
        .update(update)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },

    onMutate: async ({ id, projectId, ...update }) => {
      const queryKey = ['tasks', projectId]

      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey })

      // Snapshot the current task list before we change anything
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey)

      // Immediately update the cache with the new values
      queryClient.setQueryData<Task[]>(queryKey, (old) =>
        old?.map((task) =>
          task.id === id ? { ...task, ...update } : task
        ) ?? []
      )

      // Return snapshot so onError can roll back
      return { previousTasks, queryKey }
    },

    onError: (_err, _variables, context) => {
      // Roll back to the snapshot we saved in onMutate
      if (context) {
        queryClient.setQueryData(context.queryKey, context.previousTasks)
      }
      toast.error('Failed to update task — changes reverted')
    },

    onSettled: (_data, _err, variables) => {
      // Always sync with server after mutation (success or failure)
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.projectId] })
    },
  })
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function useDeleteTask() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      projectId,
    }: {
      id: string
      projectId: string
    }): Promise<void> => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      toast.success('Task deleted')
    },
    onError: () => {
      toast.error('Failed to delete task')
    },
  })
}
