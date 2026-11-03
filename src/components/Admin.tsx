import { useEffect, useRef, useState, type FormEvent } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { Session } from "@supabase/supabase-js";
import {
  Feather,
  ArrowLeft,
  Plus,
  FileText,
  Clock,
  Check,
  LogOut,
  Search,
  Pencil,
  Trash2,
  X,
  Image as ImageIcon,
  Video as VideoIcon,
  Link as LinkIcon,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo2,
  Redo2,
  Minus,
  AlignLeft,
  AlignCenter,
  Upload,
  Eye,
  PanelLeft,
  Save,
  ArrowUpRight,
  LockKeyhole,
  AlertCircle,
  Folder,
  Palette,
} from "lucide-react";
import { supabase, configured } from "../lib/supabase";
import {
  createCategory,
  deletePost,
  getPosts,
  hydrateContent,
  mediaUrl,
  savePost,
  uploadMedia,
} from "../lib/api";
import {
  cleanContent,
  localDatetime,
  newPost,
  postState,
  readingTime,
  safeUrl,
  slugify,
  videoUrl,
  type Post,
} from "../lib/types";
import StudioSettings from "./StudioSettings";
import { useJournal, ThemeToggle } from "./JournalProvider";
import { categoryName } from "../lib/preferences";
import { extensions } from "./RichContent";
function errorText(e: unknown) {
  return e instanceof Error
    ? e.message
    : typeof e === "object" && e && "message" in e
      ? String(e.message)
      : "Something went wrong. Please try again.";
}
export default function Admin() {
  const { categories } = useJournal();
  const [panel, setPanel] = useState<"posts" | "categories" | "appearance">(
    "posts",
  );
  const [session, setSession] = useState<Session | null>(null),
    [authorized, setAuthorized] = useState(false),
    [checking, setChecking] = useState(configured),
    [demo, setDemo] = useState(false),
    [authError, setAuthError] = useState(""),
    [authBusy, setAuthBusy] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [filter, setFilter] = useState("All posts"),
    [query, setQuery] = useState(""),
    [editing, setEditing] = useState<Post | null>(null),
    [remove, setRemove] = useState<Post | null>(null),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    async function check(s: Session | null) {
      setSession(s);
      setAuthorized(false);
      if (s) {
        const { data, error } = await supabase!.rpc("is_admin");
        if (active) {
          setAuthorized(data === true);
          if (error || !data)
            setAuthError("This account does not have administrator access.");
        }
      }
      if (active) setChecking(false);
    }
    supabase.auth.getSession().then(({ data }) => check(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setTimeout(() => {
        if (active) check(s);
      }, 0);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  async function load() {
    setLoading(true);
    try {
      setPosts(await getPosts(true));
      setError("");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (authorized || demo) load();
  }, [authorized, demo]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(t);
  }, [notice]);
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return;
    setAuthBusy(true);
    setAuthError("");
    const f = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")),
      password: String(f.get("password")),
    });
    if (error) setAuthError(error.message);
    setAuthBusy(false);
  }
  async function logout() {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error.message);
        return;
      }
    }
    setAuthorized(false);
    setSession(null);
    setDemo(false);
    setEditing(null);
  }
  if (checking) return <div className="loading">Checking studio access…</div>;
  if (!authorized && !demo)
    return (
      <div className="login-shell">
        <div className="login-theme">
          <ThemeToggle />
        </div>
        <a href="#/" className="back-link">
          <ArrowLeft size={16} /> Back to journal
        </a>
        <div className="login-card">
          <span className="login-brand">
            <Feather size={24} />
          </span>
          <span className="eyebrow">A LITTLE SPACE TO CREATE</span>
          <h1>Your writer’s studio.</h1>
          <p>
            Bring your next idea to life.
            <br />
            Sign in to manage your journal.
          </p>
          {!configured ? (
            <div className="setup-box">
              <strong>Preview mode</strong>
              <p>
                Connect your Supabase project to enable secure sign-in, uploads,
                and publishing. The included README walks you through setup.
              </p>
              <button className="primary" onClick={() => setDemo(true)}>
                Explore the studio <ArrowUpRight size={16} />
              </button>
              <small>The studio preview cannot save or publish.</small>
            </div>
          ) : session ? (
            <>
              <p className="error">
                {authError || "Administrator access is required."}
              </p>
              <button className="secondary" onClick={logout}>
                Sign out and use another account
              </button>
            </>
          ) : (
            <form onSubmit={login}>
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  placeholder="you@example.com"
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  placeholder="Your password"
                />
              </label>
              {authError && (
                <p className="error" role="alert">
                  {authError}
                </p>
              )}
              <button className="primary full-width" disabled={authBusy}>
                {authBusy ? "Signing in…" : "Enter your studio"}{" "}
                <ArrowUpRight size={17} />
              </button>
              <small>
                Invite-only access. Your readers can’t create accounts here.
              </small>
            </form>
          )}
          <div className="login-security">
            <LockKeyhole size={13} /> Private workspace · Secure authentication
          </div>
        </div>
      </div>
    );
  const counts = {
    all: posts.length,
    published: posts.filter((p) => postState(p) === "Published").length,
    drafts: posts.filter((p) => postState(p) === "Draft").length,
    scheduled: posts.filter((p) => postState(p) === "Scheduled").length,
  };
  const visible = posts.filter(
    (p) =>
      (filter === "All posts" || postState(p) === filter) &&
      `${p.title} ${p.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="studio-shell">
      <aside className="studio-sidebar">
        <a className="wordmark" href="#/admin">
          <span className="brand-icon">
            <Feather size={20} />
          </span>
          inkstone<span className="brand-period">.</span>
        </a>
        <div className="studio-caption">WRITER’S STUDIO</div>
        <nav aria-label="Studio navigation">
          {[
            ["All posts", FileText, counts.all],
            ["Published", Check, counts.published],
            ["Draft", Pencil, counts.drafts],
            ["Scheduled", Clock, counts.scheduled],
          ].map(([name, Icon, count]) => {
            const I = Icon as typeof FileText;
            return (
              <button
                key={String(name)}
                className={panel === "posts" && filter === name ? "active" : ""}
                onClick={() => {
                  if (
                    editing &&
                    !window.confirm(
                      "Leave the editor? Unsaved changes will be lost.",
                    )
                  )
                    return;
                  setEditing(null);
                  setFilter(String(name));
                  setPanel("posts");
                }}
              >
                <I size={18} />
                <span>
                  {String(name) === "Draft" ? "Drafts" : String(name)}
                </span>
                <small>{String(count)}</small>
              </button>
            );
          })}
          <div className="nav-section-label">PERSONALIZE</div>
          {(
            [
              ["categories", "Categories", Folder],
              ["appearance", "Appearance", Palette],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              className={panel === id ? "active" : ""}
              onClick={() => {
                if (
                  editing &&
                  !window.confirm(
                    "Leave the editor? Unsaved changes will be lost.",
                  )
                )
                  return;
                setEditing(null);
                setPanel(id);
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a href="#/" target="_blank" rel="noreferrer">
            <Eye size={17} /> View journal <ArrowUpRight size={15} />
          </a>
          <div className="studio-profile">
            <span className="avatar">TS</span>
            <div>
              <strong>Tejeswara Sai</strong>
              <small>Administrator</small>
            </div>
            <button
              aria-label="Sign out"
              className="icon-button"
              onClick={logout}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="studio-main">
        <header className="studio-topbar">
          <span>
            <PanelLeft size={17} />{" "}
            {editing ? "Story editor" : "Your journal, behind the scenes"}
          </span>
          <ThemeToggle />
          <a href="#/">
            Back to journal <ArrowUpRight size={15} />
          </a>
        </header>
        {demo && (
          <div className="demo-banner">
            <AlertCircle size={16} /> Studio preview · Changes are temporary.
            Connect Supabase to save and publish.
          </div>
        )}
        {notice && (
          <div className="toast" role="status">
            <Check size={17} />
            {notice}
          </div>
        )}
        {error && (
          <div className="error studio-error" role="alert">
            {error}
            <button className="secondary" onClick={load}>
              Try again
            </button>
          </div>
        )}
        {panel !== "posts" ? (
          <StudioSettings
            panel={panel}
            posts={posts}
            demo={demo}
            onChanged={load}
          />
        ) : editing ? (
          <PostEditor
            key={editing.id}
            post={editing}
            demo={demo}
            onClose={() => setEditing(null)}
            onSaved={async (p, message) => {
              setPosts((prev) => [p, ...prev.filter((x) => x.id !== p.id)]);
              setEditing(p);
              setNotice(message);
            }}
          />
        ) : (
          <div className="dashboard">
            <div className="dashboard-heading">
              <div>
                <span className="eyebrow">MAKE ROOM FOR YOUR NEXT IDEA</span>
                <h1>
                  Your stories<span>.</span>
                </h1>
                <p>A thought today. A story someone needs tomorrow.</p>
              </div>
              <button className="primary" onClick={() => setEditing(newPost())}>
                <Plus size={18} /> New story
              </button>
            </div>
            <div className="stats-grid">
              {[
                ["Total stories", counts.all, FileText],
                ["Published", counts.published, Check],
                ["Drafts", counts.drafts, Pencil],
                ["Scheduled", counts.scheduled, Clock],
              ].map(([label, n, Icon]) => {
                const I = Icon as typeof FileText;
                return (
                  <div className="stat-card" key={String(label)}>
                    <span>
                      {String(label)}
                      <I size={17} />
                    </span>
                    <strong>{String(n).padStart(2, "0")}</strong>
                  </div>
                );
              })}
            </div>
            <div className="post-list-panel">
              <div className="list-heading">
                <h2>{filter === "Draft" ? "Drafts" : filter}</h2>
                <label className="search-field">
                  <Search size={16} />
                  <input
                    aria-label="Search posts"
                    placeholder="Search your stories…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
              </div>
              {loading ? (
                <p className="loading">Loading your stories…</p>
              ) : visible.length === 0 ? (
                <div className="empty">
                  <Feather />
                  <h3>Your next story starts here.</h3>
                  <p>
                    {query
                      ? "No stories match that search."
                      : "Create a new story and let your ideas take shape."}
                  </p>
                  <button
                    className="secondary"
                    onClick={() => setEditing(newPost())}
                  >
                    <Plus size={16} />
                    New story
                  </button>
                </div>
              ) : (
                <div className="posts-table">
                  <div className="table-header">
                    <span>STORY</span>
                    <span>STATUS</span>
                    <span>DATE</span>
                    <span>ACTIONS</span>
                  </div>
                  {visible.map((p) => (
                    <div className="post-row" key={p.id}>
                      <button
                        className="post-title"
                        onClick={() => setEditing(p)}
                      >
                        <span
                          className={`post-mini mini-${p.category.replace(/\W/g, "")}`}
                        >
                          <FileText size={22} />
                        </span>
                        <span>
                          <strong>{p.title || "Untitled story"}</strong>
                          <small>
                            {p.category} <span className="dot">·</span>{" "}
                            {readingTime(p.content)} min read
                          </small>
                        </span>
                      </button>
                      <span
                        className={`status status-${postState(p).toLowerCase()}`}
                      >
                        <i />
                        {postState(p)}
                      </span>
                      <span className="table-date">
                        {new Date(
                          p.published_at || p.updated_at,
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {postState(p) === "Scheduled" && (
                          <small>
                            {new Date(p.published_at!).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </small>
                        )}
                      </span>
                      <div className="table-actions">
                        <button
                          className="icon-button"
                          aria-label={`Edit ${p.title}`}
                          onClick={() => setEditing(p)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-button danger"
                          aria-label={`Delete ${p.title}`}
                          onClick={() => setRemove(p)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="studio-tip">
              <Feather size={19} />
              <p>
                <strong>A small reminder</strong> You don’t need a perfect first
                draft. You just need a first draft.
              </p>
            </div>
          </div>
        )}
      </div>
      {remove && (
        <div className="modal-scrim">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="modal"
          >
            <h2 id="delete-title">Delete this story?</h2>
            <p>
              “{remove.title}” will be permanently deleted. This can’t be
              undone.
            </p>
            {error && <p className="error">{error}</p>}
            <div className="modal-actions">
              <button
                className="secondary"
                disabled={busy}
                onClick={() => setRemove(null)}
              >
                Keep story
              </button>
              <button
                className="danger-button"
                disabled={busy || demo}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await deletePost(remove.id);
                    setPosts((ps) => ps.filter((p) => p.id !== remove.id));
                    setRemove(null);
                    setError("");
                    setNotice("Story deleted.");
                  } catch (e) {
                    setError(errorText(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Deleting…" : "Delete story"}
              </button>
            </div>
            {demo && <small>Deletion is disabled in preview mode.</small>}
          </section>
        </div>
      )}
    </div>
  );
}
function PostEditor({
  post,
  demo,
  onClose,
  onSaved,
}: {
  post: Post;
  demo: boolean;
  onClose: () => void;
  onSaved: (p: Post, message: string) => void;
}) {
  const { categories, reload } = useJournal();
  const [newCategory, setNewCategory] = useState("");
  const [value, setValue] = useState(post),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [preview, setPreview] = useState(false),
    [ready, setReady] = useState(false),
    [schedule, setSchedule] = useState(localDatetime(post.published_at)),
    [insert, setInsert] = useState<"image" | "video" | "link" | null>(null),
    [url, setUrl] = useState(""),
    [alt, setAlt] = useState(""),
    [coverUrl, setCoverUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null),
    coverRef = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    extensions,
    content: post.content,
    editorProps: { attributes: { class: "prose editor-prose" } },
    onUpdate: ({ editor }) => {
      setValue((v) => ({ ...v, content: cleanContent(editor.getJSON()) }));
      setDirty(true);
    },
  });
  useEffect(() => {
    let live = true;
    Promise.all([hydrateContent(post.content), mediaUrl(post.cover_path)])
      .then(([content, cover]) => {
        if (live) {
          editor?.commands.setContent(content, { emitUpdate: false });
          setCoverUrl(cover);
          setReady(true);
        }
      })
      .catch((e) => {
        if (live) {
          setError(errorText(e));
          setReady(true);
        }
      });
    return () => {
      live = false;
    };
  }, [editor, post.id]);
  useEffect(() => {
    editor?.setEditable(!preview && !busy && ready, false);
  }, [editor, preview, busy, ready]);
  useEffect(() => {
    const f = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", f);
    return () => window.removeEventListener("beforeunload", f);
  }, [dirty]);
  function update<K extends keyof Post>(key: K, val: Post[K]) {
    setValue((v) => ({ ...v, [key]: val }));
    setDirty(true);
  }
  async function save(mode: "draft" | "now" | "schedule") {
    setError("");
    if (!value.title.trim()) {
      setError("Give your story a title first.");
      return;
    }
    const slug = slugify(value.slug || value.title);
    if (!slug) {
      setError("Choose a URL slug with letters or numbers.");
      return;
    }
    let published_at = mode === "now" ? new Date().toISOString() : null;
    if (mode === "schedule") {
      if (!schedule || Date.parse(schedule) <= Date.now()) {
        setError("Choose a publishing time in the future.");
        return;
      }
      published_at = new Date(schedule).toISOString();
    }
    setBusy(true);
    try {
      const p = await savePost({
        ...value,
        title: value.title.trim(),
        slug,
        status: mode === "draft" ? "draft" : "published",
        published_at,
      });
      setValue(p);
      setDirty(false);
      onSaved(
        p,
        mode === "draft"
          ? "Draft saved."
          : mode === "schedule"
            ? "Story scheduled. It will appear automatically at your chosen time."
            : "Your story is now live.",
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File, cover = false) {
    if (demo) {
      setError("Uploads are available after connecting Supabase.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (cover && !file.type.startsWith("image/"))
        throw Error("Choose an image for the cover.");
      const path = await uploadMedia(value.id, file);
      const src = await mediaUrl(path);
      if (cover) {
        update("cover_path", path);
        setCoverUrl(src);
      } else if (file.type.startsWith("video/"))
        editor
          ?.chain()
          .focus()
          .insertContent({ type: "video", attrs: { src, storagePath: path } })
          .run();
      else
        editor
          ?.chain()
          .focus()
          .setImage({ src, alt })
          .updateAttributes("image", { storagePath: path })
          .run();
      setInsert(null);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  function insertUrl(e: FormEvent) {
    e.preventDefault();
    const clean = safeUrl(url);
    if (!clean) {
      setError("Enter a valid http or https URL.");
      return;
    }
    if (insert === "link") {
      if (editor?.state.selection.empty)
        editor
          .chain()
          .focus()
          .insertContent({
            type: "text",
            text: alt || clean,
            marks: [{ type: "link", attrs: { href: clean } }],
          })
          .run();
      else editor?.chain().focus().setLink({ href: clean }).run();
    } else if (insert === "image")
      editor?.chain().focus().setImage({ src: clean, alt }).run();
    else {
      const embed = videoUrl(clean);
      if (!embed) {
        setError("Use a YouTube or Vimeo URL, or upload an MP4/WebM video.");
        return;
      }
      editor
        ?.chain()
        .focus()
        .insertContent({ type: "videoEmbed", attrs: { src: embed } })
        .run();
    }
    setInsert(null);
    setError("");
  }
  const tool = (
    label: string,
    Icon: typeof Bold,
    action: () => void,
    active = false,
  ) => (
    <button
      key={label}
      type="button"
      className={`editor-tool ${active ? "active" : ""}`}
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={action}
      disabled={preview || busy || !ready}
    >
      <Icon size={17} />
    </button>
  );
  return (
    <div className="editor-layout">
      <div className="editor-heading">
        <button
          className="text-button"
          onClick={() => {
            if (!dirty || window.confirm("Leave without saving your changes?"))
              onClose();
          }}
        >
          <ArrowLeft size={17} /> All stories
        </button>
        <div>
          <span className={`status status-${postState(value).toLowerCase()}`}>
            <i />
            {dirty ? "Unsaved changes" : postState(value)}
          </span>
          <button
            className="secondary"
            disabled={!ready || busy}
            onClick={() => setPreview((v) => !v)}
          >
            <Eye size={16} />
            {preview ? "Back to editing" : "Preview"}
          </button>
          <button
            className="primary"
            disabled={demo || busy || !ready}
            onClick={() => save("draft")}
          >
            <Save size={16} />
            {busy ? "Saving…" : "Save as draft"}
          </button>
        </div>
      </div>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <div className="editor-columns">
        <section className="writing-panel">
          <div className="writing-meta">
            <span className="eyebrow">
              {preview ? "STORY PREVIEW" : "LET YOUR IDEAS TAKE SHAPE"}
            </span>
            <span>{readingTime(value.content)} min read</span>
          </div>
          {coverUrl && (
            <div className="editor-cover">
              <img src={coverUrl} alt={value.cover_alt} />
              {!preview && (
                <button
                  className="icon-button"
                  aria-label="Remove cover"
                  onClick={() => {
                    update("cover_path", null);
                    setCoverUrl("");
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}
          {preview ? (
            <h1 className="preview-title">{value.title || "Untitled story"}</h1>
          ) : (
            <textarea
              className="title-input"
              aria-label="Story title"
              placeholder="Your story starts here…"
              value={value.title}
              rows={2}
              maxLength={220}
              disabled={busy}
              onChange={(e) => update("title", e.target.value)}
            />
          )}
          <div className="writing-byline">
            By {value.author} <span className="dot">·</span> {value.category}
          </div>
          {!preview && (
            <div className="editor-toolbar">
              {tool(
                "Bold",
                Bold,
                () => editor?.chain().focus().toggleBold().run(),
                editor?.isActive("bold"),
              )}
              {tool(
                "Italic",
                Italic,
                () => editor?.chain().focus().toggleItalic().run(),
                editor?.isActive("italic"),
              )}
              <span />
              {tool(
                "Heading 2",
                Heading2,
                () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
                editor?.isActive("heading", { level: 2 }),
              )}
              {tool(
                "Heading 3",
                Heading3,
                () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
                editor?.isActive("heading", { level: 3 }),
              )}
              {tool("Bullet list", List, () =>
                editor?.chain().focus().toggleBulletList().run(),
              )}
              {tool("Numbered list", ListOrdered, () =>
                editor?.chain().focus().toggleOrderedList().run(),
              )}
              {tool("Quote", Quote, () =>
                editor?.chain().focus().toggleBlockquote().run(),
              )}
              {tool("Code block", Code, () =>
                editor?.chain().focus().toggleCodeBlock().run(),
              )}
              {tool("Divider", Minus, () =>
                editor?.chain().focus().setHorizontalRule().run(),
              )}
              <span />
              {tool("Align left", AlignLeft, () =>
                editor?.chain().focus().setTextAlign("left").run(),
              )}
              {tool("Align center", AlignCenter, () =>
                editor?.chain().focus().setTextAlign("center").run(),
              )}
              {tool("Add link", LinkIcon, () => {
                setInsert("link");
                setUrl("");
                setAlt("");
              })}
              {tool("Add image", ImageIcon, () => {
                setInsert("image");
                setUrl("");
                setAlt("");
              })}
              {tool("Add video", VideoIcon, () => {
                setInsert("video");
                setUrl("");
                setAlt("");
              })}
              <span />
              {tool("Undo", Undo2, () => editor?.chain().focus().undo().run())}
              {tool("Redo", Redo2, () => editor?.chain().focus().redo().run())}
            </div>
          )}
          {!ready ? (
            <p className="loading">Preparing editor…</p>
          ) : (
            <EditorContent editor={editor} />
          )}
          <div className="editor-bottom">
            <span>
              {preview
                ? "Reading preview"
                : "Rich text · Markdown shortcuts supported"}
            </span>
            <span>
              {dirty ? "You have unsaved changes" : "All changes saved"}
            </span>
          </div>
        </section>
        <aside className="publish-panel">
          <h3>Story settings</h3>
          <label>
            Author
            <input
              value={value.author}
              disabled={busy || preview}
              onChange={(e) => update("author", e.target.value)}
              maxLength={100}
            />
          </label>
          <label>
            Category
            <select
              value={value.category}
              disabled={busy || preview}
              onChange={(e) => update("category", e.target.value)}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          {!preview && (
            <form
              className="inline-category-create"
              onSubmit={async (e) => {
                e.preventDefault();
                if (demo) return;
                setBusy(true);
                setError("");
                try {
                  const name = categoryName(newCategory);
                  await createCategory(name);
                  await reload();
                  update("category", name);
                  setNewCategory("");
                } catch (e) {
                  setError(errorText(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                <span className="sr-only">New category in editor</span>
                <input
                  placeholder="New category…"
                  aria-label="New category in editor"
                  maxLength={60}
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
              </label>
              <button
                className="icon-button"
                aria-label="Create category in editor"
                disabled={demo || busy || !newCategory.trim()}
              >
                <Plus size={16} />
              </button>
            </form>
          )}
          <label>
            Story URL
            <input
              value={value.slug}
              disabled={busy || preview}
              onChange={(e) => update("slug", slugify(e.target.value))}
              placeholder={slugify(value.title) || "your-story-url"}
            />
            <small>Changing a published URL breaks its old link.</small>
          </label>
          <label>
            Excerpt
            <textarea
              rows={4}
              disabled={busy || preview}
              value={value.excerpt}
              onChange={(e) => update("excerpt", e.target.value)}
              maxLength={350}
              placeholder="A short introduction to your story…"
            />
            <small>{value.excerpt.length}/350 characters</small>
          </label>
          <label>
            Cover image
            <button
              className="upload-cover"
              disabled={busy || preview || demo}
              onClick={() => coverRef.current?.click()}
            >
              <Upload size={17} />{" "}
              {coverUrl ? "Replace cover" : "Upload a cover"}
            </button>
          </label>
          <input
            ref={coverRef}
            type="file"
            hidden
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file, true);
              e.target.value = "";
            }}
          />
          <label>
            Cover description
            <input
              value={value.cover_alt}
              disabled={busy || preview}
              placeholder="Describe your image"
              onChange={(e) => update("cover_alt", e.target.value)}
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={value.featured}
              disabled={busy || preview}
              onChange={(e) => update("featured", e.target.checked)}
            />{" "}
            Feature this story
          </label>
          <hr />
          <h3>Ready to share?</h3>
          <p className="settings-description">
            Publish now, or choose the right moment.
          </p>
          <button
            className="primary full-width"
            disabled={busy || demo || preview || !ready}
            onClick={() => save("now")}
          >
            <ArrowUpRight size={16} /> Publish now
          </button>
          <label className="schedule-label">
            Schedule for later
            <input
              aria-label="Scheduled publishing date"
              type="datetime-local"
              value={schedule}
              disabled={busy || preview}
              onChange={(e) => setSchedule(e.target.value)}
            />
            <small>
              {Intl.DateTimeFormat().resolvedOptions().timeZone} · Your local
              time
            </small>
          </label>
          <button
            className="secondary full-width"
            disabled={busy || demo || preview || !ready}
            onClick={() => save("schedule")}
          >
            <Clock size={16} /> Schedule story
          </button>
          {post.status === "published" && (
            <p className="settings-description">
              Saving as draft removes this story from the public journal.
            </p>
          )}
        </aside>
      </div>
      {insert && (
        <div className="modal-scrim">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="insert-title"
          >
            <button
              aria-label="Close insert dialog"
              className="icon-button modal-close"
              disabled={busy}
              onClick={() => setInsert(null)}
            >
              <X size={20} />
            </button>
            <h2 id="insert-title">
              Add{" "}
              {insert === "link"
                ? "a link"
                : insert === "image"
                  ? "an image"
                  : "a video"}
            </h2>
            <form onSubmit={insertUrl}>
              <label>
                {insert === "video" ? "YouTube or Vimeo URL" : "URL"}
                <input
                  autoFocus
                  required
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://…"
                />
              </label>
              {insert !== "video" && (
                <label>
                  {insert === "image"
                    ? "Image description"
                    : "Link text (optional)"}
                  <input value={alt} onChange={(e) => setAlt(e.target.value)} />
                </label>
              )}
              {error && <p className="error">{error}</p>}
              <button disabled={busy} className="primary full-width">
                Insert {insert}
              </button>
            </form>
            {insert !== "link" && (
              <>
                <div className="or-divider">or upload a file</div>
                <button
                  disabled={busy || demo}
                  className="secondary full-width"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload size={16} />
                  {busy ? "Uploading…" : "Choose file"}
                </button>
                <small>
                  {insert === "image" ? "JPG, PNG, WebP or GIF" : "MP4 or WebM"}{" "}
                  · up to 25 MB
                </small>
              </>
            )}
            <input
              hidden
              ref={fileRef}
              type="file"
              accept={
                insert === "video"
                  ? "video/mp4,video/webm"
                  : "image/png,image/jpeg,image/webp,image/gif"
              }
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file);
                e.target.value = "";
              }}
            />
          </section>
        </div>
      )}
    </div>
  );
}
