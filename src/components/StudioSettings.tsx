import { useEffect, useState, type FormEvent } from "react";
import {
  FolderPlus,
  Folder,
  Palette,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Save,
  Type,
  ArrowUpRight,
  Sun,
  Moon,
} from "lucide-react";
import { useJournal } from "./JournalProvider";
import {
  createCategory,
  renameCategory,
  removeCategory,
  saveSettings,
} from "../lib/api";
import { fonts, fontFamily, type SiteSettings } from "../lib/preferences";
import type { Post } from "../lib/types";
function message(e: unknown) {
  return e instanceof Error
    ? e.message
    : typeof e === "object" && e && "message" in e
      ? String(e.message)
      : "Something went wrong. Please try again.";
}
export default function StudioSettings({
  panel,
  posts,
  demo,
  onChanged,
}: {
  panel: "categories" | "appearance";
  posts: Post[];
  demo: boolean;
  onChanged: () => Promise<void>;
}) {
  const { categories, settings, reload, settingsError } = useJournal();
  const [name, setName] = useState(""),
    [renaming, setRenaming] = useState<string | null>(null),
    [rename, setRename] = useState(""),
    [deleting, setDeleting] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const [draft, setDraft] = useState<SiteSettings>(settings);
  useEffect(() => {
    setDraft(settings);
  }, [settings.heading_font, settings.body_font, settings.default_theme]);
  async function run(action: () => Promise<unknown>, notice: string) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await action();
      await reload();
      await onChanged();
      setSuccess(notice);
      return true;
    } catch (e) {
      setError(message(e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function add(e: FormEvent) {
    e.preventDefault();
    const ok = await run(
      () => createCategory(name),
      "Category created. It’s ready for your stories.",
    );
    if (ok) setName("");
  }
  return (
    <div className="dashboard settings-dashboard">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">YOUR JOURNAL. YOUR RULES.</span>
          <h1>
            {panel === "categories" ? "Your collections" : "Make it yours"}
            <span>.</span>
          </h1>
          <p>
            {panel === "categories"
              ? "Organize your ideas into categories you create."
              : "Shape the atmosphere, choose your typography, set the mood."}
          </p>
        </div>
        <span className="settings-heading-icon">
          {panel === "categories" ? (
            <FolderPlus size={28} />
          ) : (
            <Palette size={28} />
          )}
        </span>
      </div>
      {(error || settingsError) && (
        <div className="error" role="alert">
          {error || settingsError}
        </div>
      )}
      {success && (
        <div className="settings-success" role="status">
          <Check size={16} />
          {success}
        </div>
      )}
      {panel === "categories" ? (
        <>
          <form className="category-create" onSubmit={add}>
            <span className="folder-glow">
              <FolderPlus size={25} />
            </span>
            <div>
              <h2>A new home for your ideas</h2>
              <p>Create a category. Name it anything that feels like you.</p>
            </div>
            <label>
              <span className="sr-only">New category name</span>
              <input
                placeholder="e.g. Experiments, Field notes, Design…"
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={busy}
              />
            </label>
            <button className="primary" disabled={busy || demo || !name.trim()}>
              <Plus size={16} />
              Create category
            </button>
          </form>
          <div className="collection-grid">
            {categories.map((c, index) => {
              const count = posts.filter((p) => p.category === c).length;
              return (
                <section
                  className="collection-card"
                  key={c}
                  style={
                    {
                      "--collection-hue": `${(index * 65 + 240) % 360}`,
                    } as React.CSSProperties
                  }
                >
                  <div className="collection-top">
                    <span className="folder-glow">
                      <Folder size={25} />
                    </span>
                    <span className="collection-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  {renaming === c ? (
                    <form
                      className="category-rename"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const ok = await run(
                          () => renameCategory(c, rename),
                          "Category renamed. All its stories were updated.",
                        );
                        if (ok) setRenaming(null);
                      }}
                    >
                      <label>
                        <span className="sr-only">Rename {c}</span>
                        <input
                          autoFocus
                          value={rename}
                          maxLength={60}
                          required
                          onChange={(e) => setRename(e.target.value)}
                        />
                      </label>
                      <button
                        aria-label="Save category name"
                        className="icon-button"
                        disabled={busy || demo}
                      >
                        <Check size={17} />
                      </button>
                      <button
                        type="button"
                        aria-label="Cancel rename"
                        className="icon-button"
                        disabled={busy}
                        onClick={() => setRenaming(null)}
                      >
                        <X size={17} />
                      </button>
                    </form>
                  ) : (
                    <h2>{c}</h2>
                  )}
                  <p>
                    {count} {count === 1 ? "story" : "stories"}
                    <span> / COLLECTION</span>
                  </p>
                  <div className="collection-bottom">
                    {c === "Uncategorized" ? (
                      <small>Default home for unfiled stories</small>
                    ) : (
                      <>
                        <button
                          className="text-button"
                          disabled={busy || demo}
                          onClick={() => {
                            setRenaming(c);
                            setRename(c);
                            setError("");
                          }}
                        >
                          <Pencil size={13} />
                          Rename
                        </button>
                        <button
                          className="icon-button danger"
                          aria-label={`Delete category ${c}`}
                          disabled={busy || demo}
                          onClick={() => setDeleting(c)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
          <div className="settings-footnote">
            <Folder size={15} />
            <span>
              Categories work like folders for your posts. Deleting a category
              moves its stories to Uncategorized. Your writing stays intact.
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="appearance-columns">
            <section className="appearance-card">
              <div className="panel-label">
                <Type size={17} /> TYPOGRAPHY
              </div>
              <h2>Find your voice in type.</h2>
              <p>
                Choose a display font for your headlines and a reading font for
                your stories.
              </p>
              <label>
                Headlines & titles
                <select
                  aria-label="Heading font"
                  value={draft.heading_font}
                  onChange={(e) =>
                    setDraft((s) => ({
                      ...s,
                      heading_font: e.target
                        .value as SiteSettings["heading_font"],
                    }))
                  }
                >
                  {fonts.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} — {f.note}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Body & reading text
                <select
                  aria-label="Body font"
                  value={draft.body_font}
                  onChange={(e) =>
                    setDraft((s) => ({
                      ...s,
                      body_font: e.target.value as SiteSettings["body_font"],
                    }))
                  }
                >
                  {fonts.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} — {f.note}
                    </option>
                  ))}
                </select>
              </label>
              <div className="font-preview">
                <span className="eyebrow">LIVE TYPE PREVIEW</span>
                <h3 style={{ fontFamily: fontFamily(draft.heading_font) }}>
                  Ideas don’t follow
                  <br />
                  straight lines.
                </h3>
                <p style={{ fontFamily: fontFamily(draft.body_font) }}>
                  A little curiosity changes everything. Give your thoughts a
                  place to land, and your readers a reason to stay.
                </p>
                <span style={{ fontFamily: fontFamily(draft.body_font) }}>
                  Aa Bb Cc · 0123456789
                </span>
              </div>
            </section>
            <section className="appearance-card">
              <div className="panel-label">
                <Palette size={17} /> ATMOSPHERE
              </div>
              <h2>Set the first impression.</h2>
              <p>
                Your default sets the mood for new visitors. Every reader can
                switch modes using the sun or moon button.
              </p>
              <div className="theme-choices">
                {(["dark", "light"] as const).map((t) => (
                  <button
                    key={t}
                    className={`theme-choice theme-choice-${t} ${draft.default_theme === t ? "chosen" : ""}`}
                    aria-pressed={draft.default_theme === t}
                    onClick={() =>
                      setDraft((s) => ({ ...s, default_theme: t }))
                    }
                  >
                    <div className="theme-mini">
                      <i />
                      <i />
                      <span />
                    </div>
                    <span>
                      {t === "dark" ? <Moon size={15} /> : <Sun size={15} />}{" "}
                      {t === "dark" ? "Nightfall" : "Daylight"}
                      {draft.default_theme === t && <Check size={14} />}
                    </span>
                  </button>
                ))}
              </div>
              <div className="theme-note">
                Your readers’ saved preferences always take priority.
              </div>
              <div className="appearance-save">
                <button
                  className="primary full-width"
                  disabled={busy || demo}
                  onClick={() =>
                    run(
                      () => saveSettings(draft),
                      "Appearance saved. Your journal now uses these fonts and default theme.",
                    )
                  }
                >
                  <Save size={16} />
                  {busy ? "Saving…" : "Save journal appearance"}
                </button>
                <small>Applies to the public journal and your studio.</small>
              </div>
            </section>
          </div>
          <section className="font-library">
            <div className="section-heading">
              <h2>Your font library</h2>
              <span>10 carefully selected typefaces</span>
            </div>
            <div className="font-library-grid">
              {fonts.map((f) => (
                <button
                  key={f.id}
                  className={
                    draft.heading_font === f.id
                      ? "font-tile selected"
                      : "font-tile"
                  }
                  onClick={() =>
                    setDraft((s) => ({ ...s, heading_font: f.id }))
                  }
                  aria-label={`Use ${f.name} for headings`}
                >
                  <span style={{ fontFamily: f.family }}>Aa</span>
                  <strong>{f.name}</strong>
                  <small>{f.note}</small>
                  <ArrowUpRight size={14} />
                </button>
              ))}
            </div>
          </section>
        </>
      )}
      {deleting && (
        <div className="modal-scrim">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-category-title"
          >
            <h2 id="delete-category-title">Remove this category?</h2>
            <p>
              “{deleting}” will be removed. Its{" "}
              {posts.filter((p) => p.category === deleting).length} stories will
              move to Uncategorized. No posts will be deleted.
            </p>
            {error && <div className="error">{error}</div>}
            <div className="modal-actions">
              <button
                className="secondary"
                disabled={busy}
                onClick={() => setDeleting(null)}
              >
                Keep category
              </button>
              <button
                className="danger-button"
                disabled={busy || demo}
                onClick={async () => {
                  const ok = await run(
                    () => removeCategory(deleting),
                    "Category removed. Its stories are safe in Uncategorized.",
                  );
                  if (ok) setDeleting(null);
                }}
              >
                Remove category
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
