# Inkstone — your personal publishing studio

A React + TypeScript blog with a separate administrator workspace. GitHub Pages serves the website; Supabase provides PostgreSQL, authentication, and private media storage. Posts live in the database, so adding/editing/deleting/scheduling posts never requires editing GitHub or rebuilding the site.

## What is included

- Responsive public journal, topic filters, text search, featured article, and article reader.
- Invite-only email/password admin sign-in, verified against a database-managed admin allowlist.
- Rich writing with headings, bold/italic, lists, quotes, code blocks, alignment, dividers, links, images, and videos.
- Image covers, alt descriptions, excerpts, categories, authors, editable URL slugs, and article previews.
- Drafts, publish now, schedule later, unpublish by saving as draft, and permanent post deletion.
- Private upload bucket. Only admins can upload; visitors can read only media referenced by a published, due post.
- GitHub Actions deployment, reproducible lockfile, and ten automated application/database permission tests.

## Current delivery status

The source builds and runs in sample mode without any accounts. The TSA-Blogs Supabase database and private media storage are configured. Public browser configuration is in `.env.production`. The GitHub source repository is connected. Your administrator account and custom-domain DNS still need setup. The sample studio deliberately cannot save, delete, or publish. No production credentials or hardcoded passwords are included. Source repository: https://github.com/TejeswaraSaiA/TSA-Blogs.

## 1. Run the preview locally

Install Node.js 22 or newer, then open a terminal in this folder:

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. The public sample journal appears immediately. Choose **Writer’s studio → Explore the studio** to inspect the editor without a backend. Changes in sample mode are temporary.

## 2. Set up your backend (one time)

1. Create a Supabase project at https://supabase.com/dashboard. Keep the database password private.
2. Open **SQL Editor**, paste the complete contents of `supabase/schema.sql`, and run it once. Then run `supabase/changes/custom_categories_and_appearance.sql` to add custom categories and appearance settings. It creates the tables, helper functions, row-level security policies, and the private `blog-media` bucket. Do not run the initial schema twice.
3. In **Authentication → Providers → Email**, disable new user sign-ups. This app has no public sign-up page. Disable unused authentication providers as well.
4. In **Authentication → Users**, add your own user with an email and a strong password, confirming it in the dashboard if required. Enter the password yourself; do not put it in source or send it in chat. Copy that user's UUID.
5. Run the following in SQL Editor, replacing the placeholder with the actual UUID:

```sql
insert into public.admin_users(user_id) values ('YOUR_AUTH_USER_UUID');
```

6. In the Supabase project’s API settings, copy its project URL and **publishable key** (or legacy `anon` key). Never use a `service_role`, `sb_secret_…`, or database password in the frontend.
7. Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Restart Vite. Samples disappear; your real journal starts empty. Admin access is at `/#/admin`.
8. Set the Supabase authentication **Site URL** to your eventual HTTPS domain. Sign-in uses passwords and does not need an OAuth redirect. If you reset your password, do that through a trusted Supabase dashboard workflow; this version does not include a password-reset page.

The public key is designed to be visible in the built site. Database and storage permissions—not key secrecy, a hidden URL, or JavaScript checks—protect the admin data.

## 3. Deploy the site on GitHub Pages

1. Create a GitHub repository and put **the contents of this folder at its root**, including `.github/workflows/deploy.yml`. Use `main` as the default branch. Do not upload `.env.local`, `node_modules`, or generated build output. A public repository works with GitHub Free; private repository Pages availability depends on your plan.
2. Under the repository's **Settings → Secrets and variables → Actions → Variables**, add:

| Variable                 | Value                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `VITE_SUPABASE_URL`      | Your Supabase project URL                                                                                                      |
| `VITE_SUPABASE_ANON_KEY` | Your publishable/anon key                                                                                                      |
| `BASE_PATH`              | `/` for your custom domain or a `USERNAME.github.io` repository; `/REPOSITORY-NAME/` for a project URL without a custom domain |

3. Under **Settings → Pages**, set **Source** to **GitHub Actions**.
4. Push the source to `main`, or run **Deploy journal to GitHub Pages** manually from Actions.
5. The workflow installs locked dependencies, runs tests, builds, and publishes `dist/`. The committed `.env.production` supplies the public Supabase settings; repository variables are optional overrides. Deployment waits until repository Pages is enabled with GitHub Actions as its source. If `BASE_PATH` is unset, it uses `/TSA-Blogs/`; set it to `/` when connecting your custom domain. Its deployment output contains the website URL.
6. Sign in at `https://YOUR_DOMAIN/#/admin`. Post changes go directly to Supabase and appear for all readers; no GitHub commit is needed.

If using Git locally:

```sh
git init
git add .
git commit -m "Create Inkstone blog"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

GitHub may require sign-in through its supported credential manager. Never add an access token to the remote URL or commit it.

## 4. Connect your custom domain

These are templates; no domain has been connected in this delivery.

1. Verify your domain under **GitHub account Settings → Pages → Add a domain**. GitHub gives you a TXT record; copy the exact name and value to your DNS provider and keep it after verification.
2. Add the chosen hostname under **repository Settings → Pages → Custom domain**, before changing its web-routing DNS records. Example: `blog.example.com` or `www.example.com`.
3. For a subdomain, add this record at your DNS provider:

| Type  | Host              | Target                    |
| ----- | ----------------- | ------------------------- |
| CNAME | `blog` (or `www`) | `YOUR_USERNAME.github.io` |

The CNAME target has no protocol, path, or repository name.

4. For an apex domain (`example.com`), use the four GitHub Pages A records below for `@` instead of a subdomain CNAME:

| Type | Host | Value           |
| ---- | ---- | --------------- |
| A    | @    | 185.199.108.153 |
| A    | @    | 185.199.109.153 |
| A    | @    | 185.199.110.153 |
| A    | @    | 185.199.111.153 |

5. Preserve existing email/MX/TXT records. Replace only conflicting website-routing records. Avoid wildcard records. If the hostname already hosts a website, switching its DNS replaces the website reached there.
6. Allow DNS/certificate provisioning time, then enable **Enforce HTTPS** in GitHub Pages. Set `BASE_PATH` to `/` and rerun the workflow if previously using a repository subpath.
7. Update the Supabase Site URL to match the final HTTPS hostname.

A `CNAME` source file is not needed with this custom GitHub Actions workflow; configure the domain in repository Pages settings.

Official references (checked November 3, 2026, US Eastern time):

- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages
- https://vite.dev/guide/static-deploy.html
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/storage/security/access-control

## Daily publishing workflow

1. Open `/#/admin`, sign in, and choose **New story**.
2. Write your title and body. Select text to format or attach a link. Image and video buttons accept URLs or supported uploads. YouTube/Vimeo links become embeds; uploaded MP4/WebM files use an HTML video player.
3. Set an author, category, excerpt, URL slug, cover, and optional featured status. Use descriptive alt text for images.
4. **Save as draft** keeps the entire story private. This action also unpublishes an already public story.
5. **Preview** shows the article in the editor without publishing.
6. **Publish now** makes the story publicly readable immediately. To update an already published story, edit and publish again; it will get the new publication date.
7. **Schedule story** saves the current content with a future publication timestamp. The picker uses your browser’s local time zone, shown next to it; the database stores UTC. A scheduled story is not publicly retrievable before its timestamp.
8. Delete a post using the trash icon and confirm. Post deletion is permanent.

Scheduling does not need a cron job, an open admin window, or a GitHub rebuild: database queries release the post at its timestamp. An already-open journal refreshes every 30 seconds; new visitors see it on load. If several stories are featured, the newest featured story is selected.

## Media and access details

- Upload types: JPEG, PNG, WebP, GIF, MP4, WebM. Maximum: 25 MiB per file. Use video embeds for larger files. SVG/HTML uploads are intentionally unsupported.
- Files are stored under `POST_UUID/random-file-name` in a private bucket. Published visibility requires both a due post and an actual cover/content reference to that path.
- Signed media URLs last one hour and are refreshed during long reading sessions. Previously issued links can remain usable until they expire after unpublishing/deleting a story. Downloaded or externally hosted media cannot be recalled. External image URLs and embedded videos follow their provider's privacy/access behavior.
- Deleting a post removes public access to its storage objects but retains the private bytes. Replacement and abandoned uploads also remain private. Clean up unused files in the Supabase Storage dashboard after verifying they are no longer referenced. Automatic media garbage collection is not included.
- To revoke admin access, delete the relevant row from `public.admin_users` in SQL Editor. This stops subsequent protected queries even if the user still has a browser session.
- Admin pages can be discovered as URLs or source code on any static website. The protected workspace and its data require authenticated, server-enforced admin membership; hiding a route is not the security boundary.

## Checks and known limits

```sh
npm test
npm run build
npm run preview
```

The ten tests include a real embedded PostgreSQL engine (PGlite) running the exact schema, with test doubles for Supabase's auth/storage schemas. They check anonymous/non-admin/admin access, media references, due schedules, URL handling, and credential-free content persistence. Production Supabase login, uploads, storage API integration, GitHub Actions, and DNS still need an end-to-end check in your own accounts.

This uses hash routes (`/#/post/story-slug`) so GitHub Pages can handle direct links without a server rewrite. It is a client-rendered blog; per-post social preview metadata, RSS, and server-rendered search-engine pages are not included. If those become priorities, migrate to prerendering/server rendering while retaining the database and admin workflow.

The design uses optional Google Fonts with local system fallbacks; YouTube/Vimeo embeds contact those providers. Brand name, author, about text, and topic labels can be changed once in the source before launch. Routine post content is entirely managed in the studio. Supabase service availability and plan limits apply; configure backups in your own project as needed.

## Source map

- `src/App.tsx`: public journal and navigation
- `src/components/Admin.tsx`: login, dashboard, editor, publishing
- `src/components/Reader.tsx`: lazy-loaded rich article renderer
- `src/components/RichContent.tsx`: rich text and media node schema
- `src/components/StoryMedia.tsx`: covers and post metadata
- `src/lib/api.ts`: database and storage operations
- `src/lib/types.ts`: post model, schedule display, URL/content handling
- `src/styles.css`: visual design and responsive layouts
- `supabase/schema.sql`: production schema and server permissions
- `.github/workflows/deploy.yml`: automatic build and Pages deployment


## TSA deployment status

Supabase project: `iajjgwxnxtvzdwohnqce` (US East). Public site hostname requested: `tejeswarasaia.tech`. The public API key in `.env.production` is intentionally visible; no secret or service-role key is committed. Create your user in Supabase Authentication, then grant its UUID administrator membership. In GitHub Settings → Pages, choose GitHub Actions as source and rerun deployment. Set `BASE_PATH=/` when adding the custom domain.


## Custom categories, fonts, and themes

In the studio sidebar, **Categories** lets you create and rename your own categories. Rename updates all assigned stories. Removing a category safely moves its stories to the protected **Uncategorized** category. Categories are shared with the public journal immediately. You can also create a category directly in the story editor.

**Appearance** offers ten fonts, separate headline/body choices, live previews, and a default light/dark theme. Save to apply changes to readers; already-open pages refresh settings within 30 seconds. The sun/moon toggle saves each reader's theme preference in their browser. No GitHub edits are needed for any of these controls.

For an existing deployment, apply only `supabase/changes/custom_categories_and_appearance.sql` once. The production project already has this upgrade. The base `schema.sql` followed by the upgrade sets up a fresh deployment. Existing posts and categories are preserved.
