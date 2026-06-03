-- ============================================================
-- Taskflow Schema + RLS + Seed Data
-- Run this entire file in a single execution in Supabase SQL Editor
-- ============================================================

-- ENUMS
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE workspace_role AS ENUM ('owner', 'member');

-- TABLES
CREATE TABLE workspaces (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE workspace_members (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         workspace_role NOT NULL DEFAULT 'member',
  joined_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  status      task_status NOT NULL DEFAULT 'todo',
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE profiles (
  id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email     TEXT NOT NULL
);

-- HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION is_workspace_member(ws_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_workspace_owner(ws_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid() AND role = 'owner'
  );
$$;

-- ENABLE RLS
ALTER TABLE workspaces        ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;

-- RLS: workspaces
CREATE POLICY "workspaces_select" ON workspaces FOR SELECT USING (is_workspace_member(id));
CREATE POLICY "workspaces_insert" ON workspaces FOR INSERT WITH CHECK (true);
CREATE POLICY "workspaces_update" ON workspaces FOR UPDATE USING (is_workspace_owner(id));
CREATE POLICY "workspaces_delete" ON workspaces FOR DELETE USING (is_workspace_owner(id));

-- RLS: workspace_members
CREATE POLICY "wm_select" ON workspace_members FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "wm_insert" ON workspace_members FOR INSERT WITH CHECK (is_workspace_owner(workspace_id) OR user_id = auth.uid());
CREATE POLICY "wm_update" ON workspace_members FOR UPDATE USING (is_workspace_owner(workspace_id));
CREATE POLICY "wm_delete" ON workspace_members FOR DELETE USING (is_workspace_owner(workspace_id) OR user_id = auth.uid());

-- RLS: projects
CREATE POLICY "projects_select" ON projects FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (is_workspace_member(workspace_id));
CREATE POLICY "projects_delete" ON projects FOR DELETE USING (is_workspace_owner(workspace_id));

-- RLS: tasks
CREATE POLICY "tasks_select" ON tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND is_workspace_member(p.workspace_id))
);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND is_workspace_member(p.workspace_id))
);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (
  EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND is_workspace_member(p.workspace_id))
);
CREATE POLICY "tasks_delete" ON tasks FOR DELETE USING (
  EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND is_workspace_member(p.workspace_id))
);

-- RLS: profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (id = auth.uid());

-- GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON workspaces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON workspace_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- TRIGGER: auto-add creator as owner (reads user from JWT claims)
CREATE OR REPLACE FUNCTION add_workspace_owner()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := (current_setting('request.jwt.claims', true)::jsonb->>'sub')::UUID;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (NEW.id, v_user_id, 'owner');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_workspace_created
  AFTER INSERT ON workspaces
  FOR EACH ROW EXECUTE FUNCTION add_workspace_owner();

-- TRIGGER: auto-create profile on signup
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_on_signup();

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- ============================================================
-- SEED DATA (2 workspaces, 4 projects, 15+ tasks)
-- NOTE: Replace USER1_ID and USER2_ID with real auth.users UUIDs
-- Run: SELECT id, email FROM auth.users; to get IDs
-- ============================================================
-- After signing up two users, run the seed below with real IDs.
-- Example seed is in seed.sql
