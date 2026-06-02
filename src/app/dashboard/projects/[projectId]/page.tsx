import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProjectView } from '@/components/project/ProjectView'

interface Props {
  params: Promise<{ projectId: string }>
}

export default async function ProjectPage({ params }: Props) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (!project) notFound()

  return <ProjectView project={project} />
}
