'use client'

import { useState } from 'react'
import { Plus, X, AlertTriangle } from 'lucide-react'
import { useQueryStates, parseAsString } from 'nuqs'
import { useTasks } from '@/hooks/useTasks'
import { useRealtimeTasks } from '@/hooks/useRealtimeTasks'
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers'
import { useCreateTask } from '@/hooks/useTaskMutations'
import { TaskFilters } from '@/components/project/TaskFilters'
import { TaskRow } from '@/components/project/TaskRow'
import { TaskDetailPanel } from '@/components/task/TaskDetailPanel'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

type Project = Database['public']['Tables']['projects']['Row']
type Task = Database['public']['Tables']['tasks']['Row']

interface ProjectViewProps {
  project: Project
}

export function ProjectView({ project }: ProjectViewProps) {
  const { tasks, isLoading, error: tasksError } = useTasks(project.id)
  const { members } = useWorkspaceMembers(project.workspace_id)
  useRealtimeTasks(project.id)

  const createTask = useCreateTask()

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showNewTask, setShowNewTask] = useState(false)
  const [overdueTasks, setOverdueTasks] = useState<unknown[] | null>(null)
  const [loadingOverdue, setLoadingOverdue] = useState(false)

  const supabase = createClient()

  const fetchOverdue = async () => {
    setLoadingOverdue(true)
    try {
      const { data, error } = await supabase.functions.invoke('overdue-tasks', {
        body: { project_id: project.id },
      })
      if (error) throw error
      setOverdueTasks(data.overdue)
    } catch {
      setOverdueTasks([])
    } finally {
      setLoadingOverdue(false)
    }
  }

  const [filters] = useQueryStates({
    status: parseAsString.withDefault(''),
    assignee: parseAsString.withDefault(''),
  })

  const filteredTasks = tasks.filter((task) => {
    if (filters.status && task.status !== filters.status) return false
    if (filters.assignee === 'unassigned' && task.assignee_id !== null) return false
    if (filters.assignee && filters.assignee !== 'unassigned' && task.assignee_id !== filters.assignee) return false
    return true
  })

  const handleCreateTask = async (e: { preventDefault(): void }) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    try {
      await createTask.mutateAsync({
        project_id: project.id,
        title: newTaskTitle.trim(),
        status: 'todo',
      })
      setNewTaskTitle('')
      setShowNewTask(false)
    } catch {
      // handled by onError toast
    }
  }

  return (
    <div className="flex h-full gap-0">
      {/* Main content */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchOverdue}
              disabled={loadingOverdue}
              className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
            >
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {loadingOverdue ? 'Loading…' : 'Overdue'}
            </button>
            <button
              onClick={() => setShowNewTask(true)}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> New task
            </button>
          </div>
        </div>

        {/* Filters */}
        <TaskFilters members={members} />

        {/* New task inline form */}
        {showNewTask && (
          <form onSubmit={handleCreateTask} className="flex items-center gap-2">
            <input
              autoFocus
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title…"
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={createTask.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowNewTask(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* Task list */}
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg border bg-muted" />
            ))}
          </div>
        ) : tasksError ? (
          <ErrorMessage message="Failed to load tasks." />
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {tasks.length === 0 ? 'No tasks yet' : 'No tasks match the current filters'}
            </p>
            {tasks.length === 0 && (
              <button
                onClick={() => setShowNewTask(true)}
                className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
              >
                <Plus className="h-3.5 w-3.5" /> Add first task
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                members={members}
                onClick={() => setSelectedTask(task)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Overdue tasks panel */}
      {overdueTasks !== null && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-medium text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              Overdue tasks ({overdueTasks.length})
            </h3>
            <button onClick={() => setOverdueTasks(null)} className="text-amber-600 hover:text-amber-800">
              <X className="h-4 w-4" />
            </button>
          </div>
          {overdueTasks.length === 0 ? (
            <p className="text-sm text-amber-700">No overdue tasks.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {(overdueTasks as Array<{ id: string; title: string; due_date: string; profiles: { full_name: string | null; email: string } | null }>).map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
                  <span className="font-medium">{t.title}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{t.profiles?.full_name ?? t.profiles?.email ?? 'Unassigned'}</span>
                    <span className="text-red-500">{t.due_date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Task detail side panel */}
      {selectedTask && (
        <div className="ml-5 w-80 shrink-0 rounded-xl border bg-card shadow-sm">
          <TaskDetailPanel
            task={selectedTask}
            members={members}
            onClose={() => setSelectedTask(null)}
          />
        </div>
      )}
    </div>
  )
}
