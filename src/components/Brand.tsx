/** A code prompt meeting a pen nib, drawn as a small, reusable SVG mark. */
export function BrandIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`ts-mark ${className}`}
      width="28"
      height="28"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m4 10 6 6-6 6M5 27h9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m25 4 4 4-9 15-8 4 3-9L25 4Z"
        fill="currentColor"
        fillOpacity=".14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m12 27 8-11m1-9 5 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="20" cy="16" r="1.6" fill="currentColor" />
    </svg>
  );
}
export function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <a
      href="#/"
      className={footer ? "footer-logo ts-brand" : "wordmark ts-brand"}
      aria-label="TS Writes home"
    >
      <span className="brand-icon">
        <BrandIcon />
      </span>
      <span>TS Writes</span>
    </a>
  );
}
