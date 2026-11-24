-- Apply on Supabase after the Prisma migrations.
-- NestJS connects as the table owner, so it bypasses row level security.
-- These policies deny the Supabase Data API roles. Do not add permissive policies
-- unless a table is intentionally exposed outside NestJS.

alter table profiles enable row level security;
alter table experiences enable row level security;
alter table experience_members enable row level security;
alter table experience_invites enable row level security;
alter table experience_items enable row level security;
alter table item_reservations enable row level security;
alter table gift_contributions enable row level security;
alter table secret_santa_draws enable row level security;
alter table secret_santa_participants enable row level security;
alter table secret_santa_exclusions enable row level security;
alter table secret_santa_assignments enable row level security;
alter table tasks enable row level security;
alter table task_labels enable row level security;
alter table task_assignees enable row level security;
alter table attachments enable row level security;
alter table ai_imports enable row level security;
alter table ai_usage enable row level security;
alter table notifications enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on all tables in schema public from anon, authenticated;
  end if;
end $$;
