import { describe, it, expect } from "vitest";
import {
  cleanContent,
  newPost,
  postState,
  safeUrl,
  slugify,
  videoUrl,
} from "./types";
describe("publishing rules and content safety", () => {
  it("distinguishes drafts, future schedules, and due posts at the exact boundary", () => {
    const p = newPost();
    p.published_at = "2030-01-01T00:00:00.000Z";
    const time = Date.parse(p.published_at);
    expect(postState(p, time)).toBe("Draft");
    p.status = "published";
    expect(postState(p, time - 1)).toBe("Scheduled");
    expect(postState(p, time)).toBe("Published");
  });
  it("creates stable URL slugs and rejects non-network links", () => {
    expect(slugify("Café, data & AI!")).toBe("cafe-data-ai");
    expect(safeUrl("javascript:alert(1)")).toBeNull();
    expect(safeUrl("data:text/html,Hello")).toBeNull();
    expect(safeUrl("https://example.com/path")).toBe(
      "https://example.com/path",
    );
  });
  it("embeds only known video providers and valid ids", () => {
    expect(videoUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
    expect(videoUrl("https://vimeo.com/12345")).toBe(
      "https://player.vimeo.com/video/12345",
    );
    expect(videoUrl("https://evil.example/embed/123")).toBeNull();
    expect(
      videoUrl("https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ"),
    ).toBeNull();
    expect(
      videoUrl("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
    ).toBeTruthy();
  });
  it("does not persist temporary media access tokens or executable URLs", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "image",
          attrs: {
            src: "https://storage.example/private?token=secret",
            storagePath: "post/file.png",
          },
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "test",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
    };
    const result = cleanContent(input);
    expect(result.content![0].attrs!.src).toBe("");
    expect(result.content![0].attrs!.storagePath).toBe("post/file.png");
    expect(result.content![1].content![0].marks![0].attrs!.href).toBe("");
    expect(input.content[0].attrs!.src).toContain("token=secret");
  });
});
