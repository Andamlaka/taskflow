'use client'

import { useQueryStates, parseAsString } from 'nuqs'
import type { WorkspaceMember } from '@/hooks/useWorkspaceMembers'

interface TaskFiltersProps {
  members: WorkspaceMember[]
}

export function TaskFilters({ members }: TaskFiltersProps) {
  const [filters, setFilters] = useQueryStates({
    status: parseAsString.withDefault(''),
    assignee: parseAsString.withDefault(''),
  })

  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={filters.status}
        onChange={(e) =>
          setFilters({ status: e.target.value === 'all' ? '' : e.target.value })
        }
        className="rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="all">All statuses</option>
        <option value="todo">Todo</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Done</option>
      </select>

      <select
        value={filters.assignee}
        onChange={(e) =>
          setFilters({ assignee: e.target.value === 'all' ? '' : e.target.value })
        }
        className="rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="all">All assignees</option>
        <option value="unassigned">Unassigned</option>
        {members.map((m) => (
          <option key={m.user_id} value={m.user_id}>
            {m.full_name ?? m.email}
          </option>
        ))}
      </select>
    </div>
  )
}
