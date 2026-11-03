import { useEffect, useState } from "react";
import { mediaUrl } from "../lib/api";
import { readingTime, type Post } from "../lib/types";
import { Artwork } from "./Artwork";
export function Cover({
  post,
  className = "",
}: {
  post: Post;
  className?: string;
}) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let alive = true;
    const load = () =>
      mediaUrl(post.cover_path)
        .then((u) => {
          if (alive) setUrl(u);
        })
        .catch(() => {
          if (alive) setUrl("");
        });
    load();
    const timer = setInterval(load, 3000000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [post.cover_path]);
  return post.cover_path?.startsWith("demo:") ? (
    <Artwork kind={post.cover_path.slice(5)} className={className} />
  ) : url ? (
    <img
      className={`cover ${className}`}
      src={url}
      alt={post.cover_alt}
      loading="lazy"
    />
  ) : (
    <Artwork kind="landscape" className={className} />
  );
}
export function DateLabel({ post }: { post: Post }) {
  return (
    <span>
      {new Date(post.published_at || post.created_at).toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric", year: "numeric" },
      )}
      <span className="dot">·</span>
      {readingTime(post.content)} min read
    </span>
  );
}
