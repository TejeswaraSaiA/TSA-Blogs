-- Run once in Supabase SQL Editor in your own project.
begin;
create table public.admin_users (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admin_users enable row level security;
create policy "Admin membership is managed only through privileged tooling"
 on public.admin_users for all to anon, authenticated using (false) with check (false);
-- Admin membership cannot be edited through a browser, even by an admin.
revoke all on public.admin_users from anon, authenticated;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;
create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;
create function public.is_admin() returns boolean
language sql stable security invoker set search_path = '' as $$
 select private.is_admin();
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
create table public.posts (
 id uuid primary key default gen_random_uuid(),
 title text not null check (char_length(title) between 1 and 220),
 slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug)<=120),
 excerpt text not null default '' check(char_length(excerpt)<=350),
 category text not null default 'Technology' check(category in ('Technology','Data & AI','Personal growth','Life & ideas')),
 content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
 cover_path text,
 cover_alt text not null default '',
 author text not null default 'Tejeswara Sai' check(char_length(author)<=100),
 status text not null default 'draft' check(status in ('draft','published')),
 published_at timestamptz,
 featured boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(status = 'draft' or published_at is not null)
);
-- This explicit filter also keeps the public view clean while the admin is signed in.
create function public.published_posts() returns setof public.posts
language sql stable security invoker set search_path = '' as $$
 select * from public.posts where status='published' and published_at<=now()
 order by published_at desc;
$$;
revoke all on function public.published_posts() from public;
grant execute on function public.published_posts() to anon, authenticated;
create index posts_publication on public.posts(status,published_at desc);
alter table public.posts enable row level security;
revoke all on public.posts from anon, authenticated;
grant select on public.posts to anon, authenticated;
grant insert,update,delete on public.posts to authenticated;
create policy "Visitors read only published and due stories" on public.posts
 for select to anon, authenticated using (status='published' and published_at<=now());
create policy "Admins manage all stories" on public.posts
 for all to authenticated using ((select public.is_admin())) with check((select public.is_admin()));
create or replace function public.touch_post() returns trigger
language plpgsql set search_path = '' as $$ begin
 new.updated_at=now();
 if TG_OP='UPDATE' then new.created_at=old.created_at; end if;
 return new;
end; $$;
create trigger posts_timestamp before insert or update on public.posts for each row execute function public.touch_post();
-- Private uploads: a future story's media cannot be read by visitors.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('blog-media','blog-media',false,26214400,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm']);
create policy "Admins manage blog media" on storage.objects for all to authenticated
 using(bucket_id='blog-media' and (select public.is_admin()))
 with check(bucket_id='blog-media' and (select public.is_admin()));
create policy "Visitors read media attached to a published due story" on storage.objects for select to anon, authenticated
 using(bucket_id='blog-media' and exists (
  select 1 from public.posts p where p.id::text=(storage.foldername(name))[1]
  and p.status='published' and p.published_at<=now()
  and (p.cover_path=name or jsonb_path_exists(p.content, '$.**.storagePath ? (@ == $path)',jsonb_build_object('path',name)))
 ));
commit;
-- After creating your user in Authentication > Users, copy its UUID and run:
-- insert into public.admin_users(user_id) values ('YOUR_AUTH_USER_UUID');
-- Do NOT use email/user_metadata as the authorization source.
