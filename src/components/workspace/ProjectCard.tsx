'use client'

import Link from 'next/link'
import { FolderKanban, ArrowRight } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import type { Database } from '@/types/supabase'

type Project = Database['public']['Tables']['projects']['Row']

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { tasks, isLoading } = useTasks(project.id)

  const todo = tasks.filter((t) => t.status === 'todo').length
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length
  const done = tasks.filter((t) => t.status === 'done').length
  const total = tasks.length

  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="group flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <FolderKanban className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-medium leading-tight">{project.name}</h3>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      {/* Task count bar */}
      {isLoading ? (
        <div className="h-1.5 w-full animate-pulse rounded-full bg-muted" />
      ) : total === 0 ? (
        <div className="h-1.5 w-full rounded-full bg-muted" />
      ) : (
        <div className="flex h-1.5 w-full overflow-hidden rounded-full">
          {todo > 0 && (
            <div
              className="bg-slate-300"
              style={{ width: `${(todo / total) * 100}%` }}
            />
          )}
          {inProgress > 0 && (
            <div
              className="bg-amber-400"
              style={{ width: `${(inProgress / total) * 100}%` }}
            />
          )}
          {done > 0 && (
            <div
              className="bg-emerald-500"
              style={{ width: `${(done / total) * 100}%` }}
            />
          )}
        </div>
      )}

      {/* Status counts */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          {todo} todo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          {inProgress} in progress
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {done} done
        </span>
      </div>
    </Link>
  )
}
