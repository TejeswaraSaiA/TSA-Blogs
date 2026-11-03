import { lazy, Suspense, useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  X,
  Feather,
  LockKeyhole,
  BookOpen,
  RefreshCw,
  Folder,
} from "lucide-react";
import { getPosts } from "./lib/api";
import { type Post } from "./lib/types";
import { configured } from "./lib/supabase";
import { Cover, DateLabel } from "./components/StoryMedia";
import { useJournal, ThemeToggle } from "./components/JournalProvider";
const Reader = lazy(() => import("./components/Reader"));
const Admin = lazy(() => import("./components/Admin"));
function useRoute() {
  const [hash, setHash] = useState(location.hash.slice(1) || "/");
  useEffect(() => {
    const f = () => {
      setHash(location.hash.slice(1) || "/");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return hash;
}
export default function App() {
  const route = useRoute();
  const { categories: customCategories } = useJournal();
  const categories = [
    "All stories",
    ...customCategories.filter((c) => c !== "Uncategorized"),
  ];
  const [posts, setPosts] = useState<Post[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [category, setCategory] = useState("All stories"),
    [query, setQuery] = useState(""),
    [searchOpen, setSearchOpen] = useState(false),
    [about, setAbout] = useState(false);
  useEffect(() => {
    if (category !== "All stories" && !customCategories.includes(category))
      setCategory("All stories");
  }, [customCategories, category]);
  async function load() {
    try {
      setError("");
      setPosts(await getPosts());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load stories.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const p = posts.find((p) => route === `/post/${p.slug}`);
    document.title = p
      ? `${p.title} — Inkstone`
      : route.startsWith("/admin")
        ? "Writer’s studio — Inkstone"
        : "Inkstone — A journal of ideas";
  }, [route, posts]);
  if (route.startsWith("/admin"))
    return (
      <Suspense fallback={<div className="loading">Opening studio…</div>}>
        <Admin />
      </Suspense>
    );
  if (posts.some((p) => p.category === "Uncategorized"))
    categories.push("Uncategorized");
  const filtered = posts.filter(
    (p) =>
      (category === "All stories" || p.category === category) &&
      `${p.title} ${p.excerpt} ${p.category}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const feature =
    category === "All stories" && !query
      ? filtered.find((p) => p.featured)
      : undefined;
  const rest = filtered.filter((p) => p.id !== feature?.id);
  const selected = posts.find((p) => route === `/post/${p.slug}`);
  return (
    <>
      <header className="site-header">
        <a href="#/" className="wordmark">
          <span className="brand-icon">
            <Feather size={20} />
          </span>
          inkstone<span className="brand-period">.</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#/" className={!selected ? "nav-active" : ""}>
            Journal
          </a>
          <button onClick={() => setAbout(true)}>About</button>
          <ThemeToggle />
          <button
            aria-label="Search stories"
            className="icon-button"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search size={19} />
          </button>
        </nav>
      </header>
      {searchOpen && (
        <div className="search-bar">
          <Search size={20} />
          <input
            autoFocus
            aria-label="Search stories"
            placeholder="Find an idea, a topic, a story…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (selected) location.hash = "/";
            }}
          />
          <button
            className="icon-button"
            aria-label="Close search"
            onClick={() => {
              setSearchOpen(false);
              setQuery("");
            }}
          >
            <X size={19} />
          </button>
        </div>
      )}
      {route.startsWith("/post/") ? (
        selected ? (
          <Suspense fallback={<div className="loading">Opening story…</div>}>
            <Reader post={selected} />
          </Suspense>
        ) : (
          <main className="empty">
            <BookOpen />
            <h1>{loading ? "Loading story…" : "Story unavailable"}</h1>
            <p>
              {error || "This story may be unpublished or scheduled for later."}
            </p>
            <a className="primary" href="#/">
              Back to journal
            </a>
          </main>
        )
      ) : (
        <main>
          <section className="journal-hero">
            <div className="hero-coordinate">
              INDEPENDENT THOUGHT / OPEN POSSIBILITIES
            </div>
            <div className="orbital-art" aria-hidden="true">
              <div className="orbital-halo" />
              <div className="orbital-sphere" />
              <div className="orbital-ring ring-one" />
              <div className="orbital-ring ring-two" />
              <div className="orbital-ring ring-three" />
              <span className="orbit-point point-one" />
              <span className="orbit-point point-two" />
              <div className="orbital-caption">
                THOUGHTS IN ORBIT <span>001 — ∞</span>
              </div>
            </div>
            <div className="hero-label">
              <span /> A PERSONAL JOURNAL
            </div>
            <h1>
              A curious mind.
              <br />
              <em>An open universe.</em>
            </h1>
            <p>
              Thoughts on technology, growth, and the things in between.
              <br />A little curiosity. A fresh perspective. One story at a
              time.
            </p>
            <div className="hero-signature">
              <span className="signature-line" /> Written by Tejeswara Sai
            </div>
          </section>
          <section className="stories-section">
            <div className="story-toolbar">
              <div className="category-tabs" aria-label="Filter by topic">
                {categories.map((c) => (
                  <button
                    key={c}
                    className={category === c ? "selected" : ""}
                    onClick={() => setCategory(c)}
                  >
                    {c !== "All stories" && <Folder size={13} />} {c}
                    <span className="category-count">
                      {c === "All stories"
                        ? posts.length
                        : posts.filter((p) => p.category === c).length}
                    </span>
                  </button>
                ))}
              </div>
              <span className="story-count">
                {filtered.length} {filtered.length === 1 ? "story" : "stories"}
              </span>
            </div>
            {!configured && (
              <div className="sample-note">
                SAMPLE JOURNAL{" "}
                <span>
                  Preview content · Connect your backend to publish your own
                  stories.
                </span>
              </div>
            )}
            {loading ? (
              <div className="loading">Finding a little inspiration…</div>
            ) : error ? (
              <div className="empty">
                <h2>Stories couldn’t be loaded.</h2>
                <p>{error}</p>
                <button className="secondary" onClick={load}>
                  <RefreshCw size={16} />
                  Try again
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty">
                <BookOpen size={32} />
                <h2>
                  {query ? "No stories found." : "A new chapter is on its way."}
                </h2>
                <p>
                  {query
                    ? "Try another search or explore a different topic."
                    : "Come back soon for the first story."}
                </p>
                {query && (
                  <button className="secondary" onClick={() => setQuery("")}>
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <>
                {feature && (
                  <a href={`#/post/${feature.slug}`} className="featured-story">
                    <div className="feature-art">
                      <Cover post={feature} />
                      <span className="featured-badge">
                        <span /> Editor’s pick
                      </span>
                    </div>
                    <div className="feature-copy">
                      <span className="eyebrow">{feature.category}</span>
                      <h2>{feature.title}</h2>
                      <p>{feature.excerpt}</p>
                      <div className="card-meta">
                        <DateLabel post={feature} />
                      </div>
                      <span className="read-story">
                        Read the story <ArrowUpRight size={18} />
                      </span>
                    </div>
                  </a>
                )}
                <div className="section-heading">
                  <h2>
                    {query
                      ? `Results for “${query}”`
                      : feature
                        ? "The latest pages"
                        : "Stories to explore"}
                  </h2>
                  <span>A moment to read. A thought to take with you.</span>
                </div>
                <div className="stories-grid">
                  {rest.map((post) => (
                    <a
                      className="story-card"
                      href={`#/post/${post.slug}`}
                      key={post.id}
                    >
                      <div className="card-art">
                        <Cover post={post} />
                        <span className="card-arrow">
                          <ArrowUpRight size={19} />
                        </span>
                      </div>
                      <div className="card-copy">
                        <span className="eyebrow">{post.category}</span>
                        <h3>{post.title}</h3>
                        <p>{post.excerpt}</p>
                        <div className="card-meta">
                          <DateLabel post={post} />
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}
          </section>
          <section className="closing-note">
            <Feather size={25} />
            <p>
              A space for ideas.
              <br />
              <em>And a little room to grow.</em>
            </p>
            <span>Always curious. Always a work in progress.</span>
          </section>
        </main>
      )}
      <footer className="site-footer">
        <div>
          <a className="footer-logo" href="#/">
            inkstone.
          </a>
          <span>© {new Date().getFullYear()} Tejeswara Sai</span>
        </div>
        <span>Made of thoughts, not noise.</span>
        <a className="studio-link" href="#/admin">
          <LockKeyhole size={13} /> Writer’s studio
        </a>
      </footer>
      {about && (
        <div className="modal-scrim" onClick={() => setAbout(false)}>
          <section
            className="modal about-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-title"
          >
            <button
              autoFocus
              className="icon-button modal-close"
              aria-label="Close about"
              onClick={() => setAbout(false)}
            >
              <X />
            </button>
            <Feather className="about-feather" />
            <span className="eyebrow">THE PERSON BEHIND THE PAGES</span>
            <h2 id="about-title">Hello, I’m Tejeswara.</h2>
            <p>
              This is my corner of the internet—a journal for ideas about
              technology, data, personal growth, and everyday life.
            </p>
            <p>
              I believe the best ideas begin with curiosity. Thanks for spending
              a little time here.
            </p>
            <button className="primary" onClick={() => setAbout(false)}>
              Back to the journal <ArrowRight size={16} />
            </button>
          </section>
        </div>
      )}
    </>
  );
}
