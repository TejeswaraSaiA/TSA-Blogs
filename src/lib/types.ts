import type { JSONContent } from "@tiptap/react";
export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  content: JSONContent;
  cover_path: string | null;
  cover_alt: string;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author: string;
  featured: boolean;
};
export function uuid(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const h = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
export function newPost(): Post {
  const time = new Date().toISOString();
  return {
    id: uuid(),
    title: "",
    slug: "",
    excerpt: "",
    category: "Uncategorized",
    content: { type: "doc", content: [{ type: "paragraph" }] },
    cover_path: null,
    cover_alt: "",
    status: "draft",
    published_at: null,
    created_at: time,
    updated_at: time,
    author: "Tejeswara Sai",
    featured: false,
  };
}
export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}
export function postState(p: Post, now = Date.now()) {
  return p.status === "draft"
    ? "Draft"
    : p.published_at && Date.parse(p.published_at) > now
      ? "Scheduled"
      : "Published";
}
export function readingTime(content: JSONContent) {
  let text = "";
  const walk = (n: JSONContent) => {
    text += " " + (n.text || "");
    n.content?.forEach(walk);
  };
  walk(content);
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 220));
}
export function safeUrl(input: string) {
  try {
    const u = new URL(input);
    return ["https:", "http:"].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
}
export function videoUrl(input: string) {
  const u = safeUrl(input);
  if (!u) return null;
  const url = new URL(u);
  if (
    [
      "youtube.com",
      "www.youtube.com",
      "youtu.be",
      "www.youtube-nocookie.com",
    ].includes(url.hostname)
  ) {
    const id =
      url.hostname === "youtu.be"
        ? url.pathname.slice(1)
        : url.searchParams.get("v") || url.pathname.split("/").pop();
    return id && /^[\w-]{11}$/.test(id)
      ? `https://www.youtube-nocookie.com/embed/${id}`
      : null;
  }
  if (
    ["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(url.hostname)
  ) {
    const id = url.pathname.split("/").pop();
    return id && /^\d+$/.test(id)
      ? `https://player.vimeo.com/video/${id}`
      : null;
  }
  return null;
}
export function localDatetime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function cleanContent(node: JSONContent): JSONContent {
  const copy = { ...node, attrs: node.attrs ? { ...node.attrs } : undefined };
  if (copy.attrs?.storagePath) copy.attrs.src = "";
  if (copy.attrs?.src && !copy.attrs.storagePath && !safeUrl(copy.attrs.src))
    copy.attrs.src = "";
  if (
    copy.type === "videoEmbed" &&
    copy.attrs?.src &&
    !videoUrl(copy.attrs.src)
  )
    copy.attrs.src = "";
  if (copy.marks)
    copy.marks = copy.marks.map((m) =>
      m.type === "link"
        ? {
            ...m,
            attrs: { ...m.attrs, href: safeUrl(m.attrs?.href || "") || "" },
          }
        : m,
    );
  if (node.content) copy.content = node.content.map(cleanContent);
  return copy;
}
