import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { project_id } = await req.json() as { project_id: string }
  const today = new Date().toISOString().split('T')[0]

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, title, due_date, status, assignee_id')
    .eq('project_id', project_id)
    .neq('status', 'done')
    .lt('due_date', today)
    .order('due_date', { ascending: true })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const assigneeIds = [...new Set((tasks ?? []).map((t) => t.assignee_id).filter(Boolean))]

  let profiles: Array<{ id: string; full_name: string | null; email: string }> = []
  if (assigneeIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', assigneeIds)
    profiles = data ?? []
  }

  const overdue = (tasks ?? []).map((t) => {
    const profile = profiles.find((p) => p.id === t.assignee_id)
    return {
      ...t,
      assignee_name: profile?.full_name ?? profile?.email ?? null,
    }
  })

  return new Response(JSON.stringify({ overdue }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
