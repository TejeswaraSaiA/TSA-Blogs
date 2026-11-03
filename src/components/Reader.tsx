import { useEffect, useState } from "react";
import { Feather, ArrowRight } from "lucide-react";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import { hydrateContent } from "../lib/api";
import type { Post } from "../lib/types";
import { extensions } from "./RichContent";
import { Cover, DateLabel } from "./StoryMedia";
export default function Reader({ post }: { post: Post }) {
  const [content, setContent] = useState<JSONContent | null>(null),
    [error, setError] = useState("");
  const editor = useEditor({
    extensions,
    editable: false,
    content: { type: "doc", content: [] },
    editorProps: { attributes: { class: "prose" } },
  });
  useEffect(() => {
    let alive = true;
    const load = () =>
      hydrateContent(post.content)
        .then((c) => {
          if (alive) {
            setContent(c);
            setError("");
          }
        })
        .catch((e) => {
          if (alive) setError(e.message);
        });
    load();
    const timer = setInterval(load, 3000000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [post.id, post.content]);
  useEffect(() => {
    if (content) editor?.commands.setContent(content);
  }, [editor, content]);
  return (
    <main className="article-page">
      <a className="back-link" href="#/">
        ← All stories
      </a>
      <div className="article-intro">
        <span className="eyebrow">{post.category}</span>
        <h1>{post.title}</h1>
        <p>{post.excerpt}</p>
        <div className="article-byline">
          <div className="avatar">TS</div>
          <div>
            <strong>{post.author}</strong>
            <small>
              <DateLabel post={post} />
            </small>
          </div>
        </div>
      </div>
      <Cover post={post} className="article-cover" />
      {error ? (
        <div className="error">Couldn’t load this story: {error}</div>
      ) : !content ? (
        <p className="loading">Loading story…</p>
      ) : (
        <EditorContent editor={editor} className="article-body" />
      )}
      <div className="article-end">
        <Feather size={23} />
        <span>Thanks for reading.</span>
        <a href="#/">
          Explore more stories <ArrowRight size={16} />
        </a>
      </div>
    </main>
  );
}
