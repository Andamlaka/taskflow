'use client'

import { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { useUpdateTask, useDeleteTask } from '@/hooks/useTaskMutations'
import type { Database } from '@/types/supabase'
import type { WorkspaceMember } from '@/hooks/useWorkspaceMembers'

type Task = Database['public']['Tables']['tasks']['Row']
type TaskStatus = Database['public']['Enums']['task_status']

interface TaskDetailPanelProps {
  task: Task | null
  members: WorkspaceMember[]
  onClose: () => void
}

export function TaskDetailPanel({ task, members, onClose }: TaskDetailPanelProps) {
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [assigneeId, setAssigneeId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description ?? '')
      setStatus(task.status)
      setAssigneeId(task.assignee_id ?? '')
      setDueDate(task.due_date ?? '')
      setIsDirty(false)
    }
  }, [task])

  if (!task) return null

  const markDirty = () => setIsDirty(true)

  const handleSave = () => {
    updateTask.mutate({
      id: task.id,
      projectId: task.project_id,
      title,
      description: description || null,
      status,
      assignee_id: assigneeId || null,
      due_date: dueDate || null,
    })
    setIsDirty(false)
  }

  const handleDiscard = () => {
    setTitle(task.title)
    setDescription(task.description ?? '')
    setStatus(task.status)
    setAssigneeId(task.assignee_id ?? '')
    setDueDate(task.due_date ?? '')
    setIsDirty(false)
  }

  const handleDelete = () => {
    deleteTask.mutate({ id: task.id, projectId: task.project_id })
    onClose()
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="text-sm font-medium text-muted-foreground">Task details</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Fields */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); markDirty() }}
            className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); markDirty() }}
            rows={3}
            placeholder="Add a description…"
            className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as TaskStatus); markDirty() }}
            className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        {/* Assignee */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Assignee
          </label>
          <select
            value={assigneeId}
            onChange={(e) => { setAssigneeId(e.target.value); markDirty() }}
            className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.full_name ?? m.email}
              </option>
            ))}
          </select>
        </div>

        {/* Due date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Due date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => { setDueDate(e.target.value); markDirty() }}
            className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Created */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Created
          </label>
          <p className="text-sm text-muted-foreground">
            {format(new Date(task.created_at), 'MMM d, yyyy')}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-5 py-4">
        {isDirty ? (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={updateTask.isPending}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {updateTask.isPending ? 'Saving…' : 'Save changes'}
            </button>
            <button
              onClick={handleDiscard}
              className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
            >
              Discard
            </button>
          </div>
        ) : (
          <button
            onClick={handleDelete}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-destructive/30 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete task
          </button>
        )}
      </div>
    </div>
  )
}
