import { useState } from "react";
export function Orbit({ count }: { count: number }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <button
      type="button"
      className={`orbital-art interactive-orbit ${revealed ? "is-revealed" : ""}`}
      aria-label={`${count} published ${count === 1 ? "blog" : "blogs"}. ${revealed ? "Hide" : "Reveal"} blog count`}
      aria-pressed={revealed}
      onClick={() => setRevealed((v) => !v)}
    >
      <div className="orbital-halo" aria-hidden="true" />
      <div className="orbital-sphere" aria-hidden="true" />
      <div className="orbital-ring ring-one" aria-hidden="true" />
      <div className="orbital-ring ring-two" aria-hidden="true" />
      <div className="orbital-ring ring-three" aria-hidden="true" />
      <span className="orbit-point point-one" aria-hidden="true" />
      <span className="orbit-point point-two" aria-hidden="true" />
      <span className="orbital-count" aria-hidden="true">
        <span className="count-kicker">THE JOURNAL, SO FAR</span>
        <strong>{String(count).padStart(2, "0")}</strong>
        <span className="count-label">
          PUBLISHED {count === 1 ? "BLOG" : "BLOGS"}
        </span>
      </span>
      <span className="orbital-caption" aria-hidden="true">
        PERSPECTIVES IN MOTION<span>HOVER / TAP TO EXPLORE</span>
      </span>
    </button>
  );
}
