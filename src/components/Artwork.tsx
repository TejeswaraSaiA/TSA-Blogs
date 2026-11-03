export function Artwork({
  kind = "landscape",
  className = "",
}: {
  kind?: string;
  className?: string;
}) {
  return (
    <div className={`art art-${kind} ${className}`} aria-hidden="true">
      {kind === "landscape" ? (
        <svg viewBox="0 0 900 600" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="sky" x2="0" y2="1">
              <stop stopColor="#c3d4ce" />
              <stop offset="1" stopColor="#edf0dc" />
            </linearGradient>
            <linearGradient id="hill" x2="0" y2="1">
              <stop stopColor="#698c7a" />
              <stop offset="1" stopColor="#284a3d" />
            </linearGradient>
            <filter id="grain">
              <feTurbulence
                baseFrequency=".8"
                numOctaves="3"
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
              <feComponentTransfer>
                <feFuncA type="linear" slope=".10" />
              </feComponentTransfer>
              <feBlend in="SourceGraphic" mode="soft-light" />
            </filter>
          </defs>
          <g filter="url(#grain)">
            <path fill="url(#sky)" d="M0 0h900v600H0z" />
            <circle cx="672" cy="152" r="58" fill="#f9f1cb" opacity=".85" />
            <path
              d="M-100 450 220 215 360 345 550 220 1020 450v200H-100"
              fill="#9db0a0"
            />
            <path
              d="m-60 480 310-160 210 168 270-180 270 142v200H-60"
              fill="#74917d"
            />
            <path d="M-50 510q190-230 450-90t550 0v220H-50" fill="url(#hill)" />
            <path d="M0 600q180-170 340-80t300 80" fill="#203f35" />
            <path
              d="M440 600q-180-75-20-135t38-70q130 30-10 88t160 117"
              fill="#c9c7a6"
              opacity=".7"
            />
          </g>
        </svg>
      ) : kind === "abstract" ? (
        <>
          <i />
          <i />
          <i />
          <span className="orbit" />
        </>
      ) : kind === "window" ? (
        <>
          <div className="window-frame">
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="window-shadow" />
        </>
      ) : kind === "data" ? (
        <>
          <div className="data-grid" />
          <div className="data-bars">
            {[35, 63, 48, 82, 61, 95, 75].map((n, i) => (
              <i key={i} style={{ height: `${n}%` }} />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="sun-disc" />
          <div className="sun-hill" />
        </>
      )}
    </div>
  );
}
