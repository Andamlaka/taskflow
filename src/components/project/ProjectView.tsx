'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useQueryStates, parseAsString } from 'nuqs'
import { useTasks } from '@/hooks/useTasks'
import { useRealtimeTasks } from '@/hooks/useRealtimeTasks'
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers'
import { useCreateTask } from '@/hooks/useTaskMutations'
import { TaskFilters } from '@/components/project/TaskFilters'
import { TaskRow } from '@/components/project/TaskRow'
import { TaskDetailPanel } from '@/components/task/TaskDetailPanel'
import type { Database } from '@/types/supabase'

type Project = Database['public']['Tables']['projects']['Row']
type Task = Database['public']['Tables']['tasks']['Row']

interface ProjectViewProps {
  project: Project
}

export function ProjectView({ project }: ProjectViewProps) {
  const { tasks, isLoading } = useTasks(project.id)
  const { members } = useWorkspaceMembers(project.workspace_id)
  useRealtimeTasks(project.id)

  const createTask = useCreateTask()

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showNewTask, setShowNewTask] = useState(false)

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
          <button
            onClick={() => setShowNewTask(true)}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New task
          </button>
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
