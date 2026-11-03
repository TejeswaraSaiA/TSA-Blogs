import type { Post } from "./types";
const content = (paragraphs: string[]) => ({
  type: "doc",
  content: paragraphs.map((text) => ({
    type: "paragraph",
    content: [{ type: "text", text }],
  })),
});
const stories = [
  [
    "The quiet art of starting before you’re ready",
    "Personal growth",
    "There’s a particular kind of courage in beginning. Not with a perfect plan, but with a small step into the unknown.",
    "landscape",
    "2026-10-28",
  ],
  [
    "Building with AI, thinking for yourself",
    "Data & AI",
    "A few lessons from working alongside intelligent tools—and remembering who’s asking the questions.",
    "abstract",
    "2026-10-25",
  ],
  [
    "A little less noise. A little more meaning.",
    "Life & ideas",
    "On making room for the things that don’t ask for our attention, but deserve it.",
    "window",
    "2026-10-22",
  ],
  [
    "What data can’t tell you",
    "Technology",
    "The most useful insight often lives somewhere between the numbers and the people behind them.",
    "data",
    "2026-10-19",
  ],
  [
    "Small habits, long horizons",
    "Personal growth",
    "Progress is rarely a dramatic arrival. More often, it’s the quiet accumulation of ordinary days.",
    "sun",
    "2026-10-16",
  ],
];
export const demoPosts: Post[] = stories.map(
  ([title, category, excerpt, cover], i) => ({
    id: `sample-${i}`,
    title,
    category,
    excerpt,
    slug: [
      "the-quiet-art-of-starting",
      "building-with-ai",
      "a-little-less-noise",
      "what-data-cant-tell-you",
      "small-habits",
    ][i],
    content: content([
      excerpt,
      "This is a sample story to show how your journal will look. When you connect your backend, these examples are replaced by the posts you write in your private studio.",
      "Good ideas need space. A little patience, a willingness to notice, and the freedom to begin again. This journal is a place for those ideas to take shape.",
    ]),
    cover_path: `demo:${cover}`,
    cover_alt: title,
    status: "published",
    published_at: `2026-10-${28 - i * 3}T12:00:00Z`,
    created_at: "2026-10-01T12:00:00Z",
    updated_at: "2026-10-01T12:00:00Z",
    author: "Tejeswara Sai",
    featured: i === 0,
  }),
);
