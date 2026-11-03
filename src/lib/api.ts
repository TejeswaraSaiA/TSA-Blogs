import {
  categoryName,
  defaultSettings,
  type SiteSettings,
} from "./preferences";
import type { JSONContent } from "@tiptap/react";
import { supabase } from "./supabase";
import { demoPosts } from "./demo";
import type { Post } from "./types";
import { cleanContent, uuid } from "./types";
export async function getPosts(admin = false): Promise<Post[]> {
  if (!supabase) return demoPosts;
  const { data, error } = admin
    ? await supabase
        .from("posts")
        .select("*")
        .order("updated_at", { ascending: false })
    : await supabase.rpc("published_posts");
  if (error) throw error;
  return data || [];
}
export async function savePost(post: Post) {
  if (!supabase) throw Error("Connect Supabase to save posts.");
  const { data, error } = await supabase
    .from("posts")
    .upsert({ ...post, content: cleanContent(post.content) })
    .select()
    .single();
  if (error) throw error;
  return data as Post;
}
export async function deletePost(id: string) {
  if (!supabase) throw Error("Backend not configured.");
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}
export async function uploadMedia(postId: string, file: File) {
  if (!supabase) throw Error("Connect Supabase to upload media.");
  if (file.size > 25 * 1024 * 1024)
    throw Error(
      "Please choose a file under 25 MB. Use a video link for larger videos.",
    );
  if (
    ![
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm",
    ].includes(file.type)
  )
    throw Error("Supported files: JPG, PNG, WebP, GIF, MP4 and WebM.");
  const path = `${postId}/${uuid()}.${
    file.name
      .split(".")
      .pop()
      ?.replace(/[^a-z0-9]/gi, "") || "bin"
  }`;
  const { error } = await supabase.storage
    .from("blog-media")
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "60",
      upsert: false,
    });
  if (error) throw error;
  return path;
}
export async function mediaUrl(path: string | null): Promise<string> {
  if (!path || path.startsWith("demo:")) return "";
  if (!supabase) return "";
  const { data, error } = await supabase.storage
    .from("blog-media")
    .createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
export async function hydrateContent(
  content: JSONContent,
): Promise<JSONContent> {
  const copy = cleanContent(content);
  async function walk(n: JSONContent) {
    if (n.attrs?.storagePath)
      n.attrs = { ...n.attrs, src: await mediaUrl(n.attrs.storagePath) };
    if (n.content) await Promise.all(n.content.map(walk));
  }
  await walk(copy);
  return copy;
}

// Category names cascade to posts on rename; deletion moves posts to Uncategorized.
export async function getCategories(): Promise<string[]> {
  if (!supabase)
    return ["Uncategorized", ...new Set(demoPosts.map((p) => p.category))];
  const { data, error } = await supabase
    .from("categories")
    .select("name")
    .order("created_at");
  if (error) throw error;
  return (data || []).map((c) => c.name);
}
export async function createCategory(name: string) {
  if (!supabase) throw Error("Connect Supabase to manage categories.");
  const { error } = await supabase
    .from("categories")
    .insert({ name: categoryName(name) });
  if (error) throw error;
}
export async function renameCategory(oldName: string, newName: string) {
  if (!supabase) throw Error("Backend not configured.");
  const { data, error } = await supabase
    .from("categories")
    .update({ name: categoryName(newName) })
    .eq("name", oldName)
    .select("name")
    .single();
  if (error) throw error;
  return data;
}
export async function removeCategory(name: string) {
  if (!supabase) throw Error("Backend not configured.");
  const { error } = await supabase.from("categories").delete().eq("name", name);
  if (error) throw error;
}
export async function getSettings(): Promise<SiteSettings> {
  if (!supabase) return defaultSettings;
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", true)
    .single();
  if (error) throw error;
  return data as SiteSettings;
}
export async function saveSettings(settings: SiteSettings) {
  if (!supabase) throw Error("Connect Supabase to save appearance.");
  const { data, error } = await supabase
    .from("site_settings")
    .update(settings)
    .eq("id", true)
    .select()
    .single();
  if (error) throw error;
  return data as SiteSettings;
}
