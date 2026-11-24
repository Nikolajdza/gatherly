-- Run in the Supabase SQL editor. Storage tables are not part of the Prisma schema.
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('covers', 'covers', true),
  ('galleries', 'galleries', true),
  ('attachments', 'attachments', false)
on conflict (id) do nothing;
