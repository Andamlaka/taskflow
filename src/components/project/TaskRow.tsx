'use client'

import { format, isPast, isToday } from 'date-fns'
import type { Database } from '@/types/supabase'
import type { WorkspaceMember } from '@/hooks/useWorkspaceMembers'
import { useUpdateTask } from '@/hooks/useTaskMutations'

type Task = Database['public']['Tables']['tasks']['Row']
type TaskStatus = Database['public']['Enums']['task_status']

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-amber-100 text-amber-700',
  done: 'bg-emerald-100 text-emerald-700',
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
}

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
}

interface TaskRowProps {
  task: Task
  members: WorkspaceMember[]
  onClick: () => void
}

export function TaskRow({ task, members, onClick }: TaskRowProps) {
  const updateTask = useUpdateTask()

  const assignee = members.find((m) => m.user_id === task.assignee_id)

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateTask.mutate({
      id: task.id,
      projectId: task.project_id,
      status: STATUS_CYCLE[task.status],
    })
  }

  const dueDateColor = () => {
    if (!task.due_date) return 'text-muted-foreground'
    const date = new Date(task.due_date)
    if (task.status === 'done') return 'text-muted-foreground'
    if (isPast(date) && !isToday(date)) return 'text-red-500'
    if (isToday(date)) return 'text-amber-500'
    return 'text-muted-foreground'
  }

  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/50"
    >
      {/* Status badge — click cycles status */}
      <button
        onClick={handleStatusClick}
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80 ${STATUS_STYLES[task.status]}`}
      >
        {STATUS_LABELS[task.status]}
      </button>

      {/* Title */}
      <span className={`flex-1 text-sm ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
        {task.title}
      </span>

      {/* Assignee */}
      <span className="shrink-0 text-xs text-muted-foreground">
        {assignee ? (assignee.full_name ?? assignee.email) : '—'}
      </span>

      {/* Due date */}
      {task.due_date && (
        <span className={`shrink-0 text-xs ${dueDateColor()}`}>
          {format(new Date(task.due_date), 'MMM d')}
        </span>
      )}
    </div>
  )
}
