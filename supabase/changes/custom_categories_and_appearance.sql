-- Additive upgrade: preserves existing posts and categories.
begin;
create table public.categories (
 name text primary key check (char_length(name) between 1 and 60 and name=btrim(name) and lower(name)<>'all stories'),
 created_at timestamptz not null default now()
);
create unique index categories_name_case_insensitive on public.categories(lower(name));
insert into public.categories(name) values ('Uncategorized');
insert into public.categories(name) select distinct category from public.posts where category<>'Uncategorized' on conflict do nothing;
alter table public.posts drop constraint posts_category_check;
alter table public.posts alter column category set default 'Uncategorized';
alter table public.posts add constraint posts_category_fkey foreign key(category) references public.categories(name) on update cascade on delete set default;
alter table public.categories enable row level security;
revoke all on public.categories from anon,authenticated;
grant select on public.categories to anon,authenticated;
grant insert,update,delete on public.categories to authenticated;
create policy "Anyone can read journal categories" on public.categories for select to anon,authenticated using(true);
create policy "Admins create categories" on public.categories for insert to authenticated with check ((select public.is_admin()));
create policy "Admins rename custom categories" on public.categories for update to authenticated using(name<>'Uncategorized' and (select public.is_admin())) with check(name<>'Uncategorized' and (select public.is_admin()));
create policy "Admins remove custom categories" on public.categories for delete to authenticated using(name<>'Uncategorized' and (select public.is_admin()));
create table public.site_settings (
 id boolean primary key default true check(id),
 heading_font text not null default 'sora' check(heading_font in ('sora','space','outfit','dm','inter','manrope','playfair','lora','caslon','mono')),
 body_font text not null default 'dm' check(body_font in ('sora','space','outfit','dm','inter','manrope','playfair','lora','caslon','mono')),
 default_theme text not null default 'dark' check(default_theme in ('dark','light'))
);
insert into public.site_settings(id) values(true);
alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon,authenticated;
grant select on public.site_settings to anon,authenticated;
grant update on public.site_settings to authenticated;
create policy "Anyone can read journal appearance" on public.site_settings for select to anon,authenticated using(true);
create policy "Only admins change journal appearance" on public.site_settings for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));
commit;
