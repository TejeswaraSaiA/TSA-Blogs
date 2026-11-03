import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
const db = new PGlite();
const admin = "11111111-1111-4111-8111-111111111111",
  reader = "22222222-2222-4222-8222-222222222222";
const live = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  future = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  draft = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
async function as(role: string, uid = "") {
  await db.exec(
    `reset role; set role ${role}; select set_config('request.jwt.claim.sub','${uid}',false);`,
  );
}
beforeAll(async () => {
  await db.exec(`
create role anon; create role authenticated;
create schema auth; create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth,public to anon,authenticated;
grant execute on function auth.uid() to anon,authenticated;
create schema storage;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
grant usage on schema storage to anon,authenticated;
grant select on storage.objects to anon,authenticated;
grant insert,update,delete on storage.objects to authenticated;
grant execute on function storage.foldername(text) to anon,authenticated;
insert into auth.users values ('${admin}'),('${reader}');
`);
  await db.exec(
    readFileSync(new URL("../../supabase/schema.sql", import.meta.url), "utf8"),
  );
  await db.exec(`insert into public.admin_users values ('${admin}');
insert into public.posts(id,title,slug,status,published_at,cover_path,content) values
('${live}','Live','live','published',now()-interval '1 day','${live}/cover.png','{"type":"doc","content":[{"type":"image","attrs":{"storagePath":"${live}/inline.png"}}]}'),
('${future}','Future','future','published',now()+interval '1 day','${future}/cover.png','{"type":"doc"}'),
('${draft}','Private','private','draft',null,'${draft}/cover.png','{"type":"doc"}');
insert into storage.objects(bucket_id,name) values ('blog-media','${live}/cover.png'),('blog-media','${live}/inline.png'),('blog-media','${live}/unused.png'),('blog-media','${future}/cover.png'),('blog-media','${draft}/cover.png');`);
}, 30000);
afterAll(async () => db.close());
describe("Postgres authorization boundary", () => {
  it("anonymous visitors cannot read drafts, schedules, or unattached media", async () => {
    await as("anon");
    expect((await db.query("select title from public.posts")).rows).toEqual([
      { title: "Live" },
    ]);
    expect(
      (await db.query("select name from storage.objects order by name")).rows,
    ).toEqual([{ name: `${live}/cover.png` }, { name: `${live}/inline.png` }]);
    await expect(
      db.exec(
        `insert into public.posts(title,slug) values ('Hacked','hacked')`,
      ),
    ).rejects.toThrow();
  });
  it("a signed-in non-admin cannot edit posts or grant themselves admin", async () => {
    await as("authenticated", reader);
    expect((await db.query("select public.is_admin() as yes")).rows).toEqual([
      { yes: false },
    ]);
    expect((await db.query("select id from public.posts")).rows).toHaveLength(
      1,
    );
    expect(
      (await db.query("update public.posts set title='Hacked' returning id"))
        .rows,
    ).toHaveLength(0);
    await expect(
      db.exec(`insert into public.admin_users values ('${reader}')`),
    ).rejects.toThrow();
    await expect(
      db.exec(
        `insert into storage.objects(bucket_id,name) values ('blog-media','bad.png')`,
      ),
    ).rejects.toThrow();
  });
  it("admin can manage all stories but the public RPC still shows only due stories", async () => {
    await as("authenticated", admin);
    expect((await db.query("select public.is_admin() as yes")).rows).toEqual([
      { yes: true },
    ]);
    expect((await db.query("select id from public.posts")).rows).toHaveLength(
      3,
    );
    expect(
      (await db.query("select title from public.published_posts()")).rows,
    ).toEqual([{ title: "Live" }]);
    expect(
      (
        await db.query(
          `update public.posts set excerpt='Edited' where id='${draft}' returning excerpt`,
        )
      ).rows,
    ).toEqual([{ excerpt: "Edited" }]);
    await db.exec(
      `insert into public.posts(title,slug) values ('New','new'); delete from public.posts where slug='new';`,
    );
  });
  it("database time releases a scheduled story and its cover without a deploy", async () => {
    await as("authenticated", admin);
    await db.exec(
      `update public.posts set published_at=now()-interval '1 minute' where id='${future}'`,
    );
    await as("anon");
    expect(
      (await db.query("select title from public.published_posts()")).rows,
    ).toHaveLength(2);
    expect(
      (
        await db.query(
          `select name from storage.objects where name='${future}/cover.png'`,
        )
      ).rows,
    ).toHaveLength(1);
  });
});
