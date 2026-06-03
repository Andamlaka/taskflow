-- ============================================================
-- Taskflow Seed Data
-- ============================================================
-- Run this AFTER running schema.sql AND after signing up at least
-- one user (so auth.users has a row). This auto-assigns the seed
-- to the two most-recently-created users. If only one user exists,
-- that user owns everything and is the sole assignee.
--
-- Produces: 2 workspaces, 4 projects, 15 tasks across all statuses.
-- ============================================================

DO $$
DECLARE
  user1_id UUID;
  user2_id UUID;
  ws1_id UUID := gen_random_uuid();
  ws2_id UUID := gen_random_uuid();
  proj1_id UUID := gen_random_uuid();
  proj2_id UUID := gen_random_uuid();
  proj3_id UUID := gen_random_uuid();
  proj4_id UUID := gen_random_uuid();
BEGIN
  -- Pick the two most recent users (user2 falls back to user1 if only one exists)
  SELECT id INTO user1_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO user2_id FROM auth.users ORDER BY created_at DESC OFFSET 1 LIMIT 1;
  IF user2_id IS NULL THEN
    user2_id := user1_id;
  END IF;

  IF user1_id IS NULL THEN
    RAISE EXCEPTION 'No users found. Sign up at least one user before seeding.';
  END IF;

  -- Workspaces
  INSERT INTO workspaces (id, name) VALUES
    (ws1_id, 'Acme Corp'),
    (ws2_id, 'Side Projects');

  -- Members (workspace owner + second member where applicable)
  INSERT INTO workspace_members (workspace_id, user_id, role) VALUES
    (ws1_id, user1_id, 'owner'),
    (ws2_id, user1_id, 'owner')
  ON CONFLICT DO NOTHING;

  IF user2_id <> user1_id THEN
    INSERT INTO workspace_members (workspace_id, user_id, role) VALUES
      (ws1_id, user2_id, 'member')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Projects
  INSERT INTO projects (id, workspace_id, name) VALUES
    (proj1_id, ws1_id, 'Website Redesign'),
    (proj2_id, ws1_id, 'Mobile App'),
    (proj3_id, ws2_id, 'Personal Portfolio'),
    (proj4_id, ws2_id, 'Open Source Library');

  -- Tasks (15, across statuses and assignees, some overdue)
  INSERT INTO tasks (project_id, title, description, status, assignee_id, due_date) VALUES
    (proj1_id, 'Design new homepage hero', 'Mockups for the hero section', 'todo', user2_id, CURRENT_DATE + 3),
    (proj1_id, 'Migrate to design system', 'Update components to design tokens', 'in_progress', user1_id, CURRENT_DATE - 2),
    (proj1_id, 'Write About page copy', 'Draft and review content', 'done', user1_id, CURRENT_DATE - 5),
    (proj1_id, 'SEO audit', 'Run Lighthouse and fix issues', 'todo', user2_id, CURRENT_DATE + 7),
    (proj1_id, 'Fix nav mobile breakpoint', 'Navigation breaks at 375px', 'in_progress', user1_id, CURRENT_DATE - 1),
    (proj2_id, 'Setup React Native project', 'Expo + TypeScript scaffold', 'done', user1_id, CURRENT_DATE - 10),
    (proj2_id, 'Auth screens', 'Login and signup screens', 'done', user2_id, CURRENT_DATE - 8),
    (proj2_id, 'Task list screen', 'Port web task list to mobile', 'in_progress', user1_id, CURRENT_DATE + 2),
    (proj2_id, 'Push notifications', 'Due date reminders via FCM', 'todo', user2_id, CURRENT_DATE + 10),
    (proj2_id, 'App store screenshots', 'Prepare 6.5 inch screenshots', 'todo', NULL, CURRENT_DATE + 14),
    (proj3_id, 'Portfolio design', 'Figma mockup', 'done', user1_id, CURRENT_DATE - 15),
    (proj3_id, 'Build with Next.js', 'Implement the portfolio site', 'in_progress', user1_id, CURRENT_DATE + 1),
    (proj3_id, 'Write case studies', 'Document 3 projects in detail', 'todo', user1_id, CURRENT_DATE + 5),
    (proj4_id, 'Write README', 'Installation, usage, API docs', 'todo', user1_id, CURRENT_DATE + 4),
    (proj4_id, 'Setup CI/CD', 'GitHub Actions for tests and publish', 'in_progress', user1_id, CURRENT_DATE - 3);

  RAISE NOTICE 'Seed complete: 2 workspaces, 4 projects, 15 tasks.';
END $$;
