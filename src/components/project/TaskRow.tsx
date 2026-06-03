'use client'

import { format, isPast, isToday } from 'date-fns'
import type { Database } from '@/types/supabase'
import type { WorkspaceMember } from '@/hooks/useWorkspaceMembers'
import { useUpdateTask } from '@/hooks/useTaskMutations'

type Task = Database['public']['Tables']['tasks']['Row']
type TaskStatus = Database['public']['Enums']['task_status']

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  in_progress: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  done: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
}

const STATUS_DOTS: Record<TaskStatus, string> = {
  todo: 'bg-slate-400',
  in_progress: 'bg-amber-500',
  done: 'bg-emerald-500',
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
      className="group flex cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
    >
      {/* Status badge — click cycles status */}
      <button
        onClick={handleStatusClick}
        title="Click to change status"
        className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all hover:brightness-95 active:scale-95 ${STATUS_STYLES[task.status]}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[task.status]}`} />
        {STATUS_LABELS[task.status]}
      </button>

      {/* Title */}
      <span className={`flex-1 text-sm ${task.status === 'done' ? 'text-muted-foreground line-through' : 'font-medium'}`}>
        {task.title}
      </span>

      {/* Assignee */}
      {assignee ? (
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
            {(assignee.full_name ?? assignee.email).charAt(0).toUpperCase()}
          </span>
          <span className="hidden sm:inline">{assignee.full_name ?? assignee.email}</span>
        </span>
      ) : (
        <span className="shrink-0 text-xs text-muted-foreground/60">Unassigned</span>
      )}

      {/* Due date */}
      {task.due_date && (
        <span className={`shrink-0 text-xs font-medium tabular-nums ${dueDateColor()}`}>
          {format(new Date(task.due_date), 'MMM d')}
        </span>
      )}
    </div>
  )
}
