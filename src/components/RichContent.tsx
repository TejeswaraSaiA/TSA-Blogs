import { Node, mergeAttributes, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
export const StoredImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      storagePath: { default: null },
      alt: { default: "" },
    };
  },
});
export const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  addAttributes() {
    return { src: { default: "" }, storagePath: { default: null } };
  },
  parseHTML() {
    return [{ tag: "video" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(HTMLAttributes, {
        controls: true,
        preload: "metadata",
        playsinline: true,
      }),
    ];
  },
});
export const VideoEmbed = Node.create({
  name: "videoEmbed",
  group: "block",
  atom: true,
  addAttributes() {
    return { src: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "iframe[data-video]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "iframe",
      mergeAttributes(HTMLAttributes, {
        "data-video": "true",
        title: "Embedded video",
        loading: "lazy",
        allowfullscreen: "true",
        referrerpolicy: "strict-origin-when-cross-origin",
        sandbox: "allow-scripts allow-same-origin allow-presentation",
      }),
    ];
  },
});
export const extensions = [
  StarterKit.configure({
    link: {
      openOnClick: false,
      HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
    },
  }),
  StoredImage,
  Video,
  VideoEmbed,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Placeholder.configure({
    placeholder: "Every good story begins with a thought…",
  }),
];
export const emptyContent: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};
