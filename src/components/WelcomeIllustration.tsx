/**
 * Brand hero illustration: an open door, warm light spilling out, a traveler's
 * bag on the step.
 *
 * Replaces RouteMapIllustration (glowing dots joined by dashed curves on a
 * dark field) -- that "connected network nodes" motif is one of the single
 * most overused AI-generated hero images going, regardless of who drew it or
 * how the lines are dashed. It's also generic to the point of meaninglessness
 * here: it could be the hero for a logistics SaaS, a fintech app, or a VPN
 * product just as easily as a hospitality exchange. An open door with light
 * coming through it is specific to what this product actually is -- someone
 * letting you into their home -- and cannot be mistaken for anything else.
 */
export function WelcomeIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 500 600"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="An open door with warm light spilling out onto the doorstep"
    >
      <defs>
        <linearGradient id="welcomeBg" x1="0" y1="0" x2="500" y2="600" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0d1d2b" />
          <stop offset="100%" stopColor="#233241" />
        </linearGradient>
        <linearGradient id="doorGlow" x1="250" y1="150" x2="250" y2="480" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff5f33" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#b22c00" stopOpacity="0.75" />
        </linearGradient>
        <radialGradient id="lightSpill" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffdbd1" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffdbd1" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="500" height="600" fill="url(#welcomeBg)" />

      {/* Soft light pooling out of the doorway onto the step and wall. */}
      <ellipse cx="250" cy="330" rx="230" ry="260" fill="url(#lightSpill)" opacity="0.35" />

      {/*
        The whole scene (door through plant) scaled 0.8x around the canvas'
        vertical center. This container is cropped to very different aspect
        ratios by its two callers -- a tall marketing hero and a short, wide
        app-home hero -- via preserveAspectRatio="slice", which crops from the
        top and bottom on anything wider than the source. Undoing that scale,
        the doorstep (bag, mat, plant) sat low enough in the frame that a wide
        crop sliced it off entirely, leaving just an orange rectangle. Scaling
        the composition toward centre first means both crops keep the story.
      */}
      <g transform="translate(250 300) scale(1 0.8) translate(-250 -300)">
        {/* Door frame */}
        <rect x="160" y="130" width="180" height="350" rx="4" fill="none" stroke="#e3beb5" strokeWidth="3" opacity="0.5" />

        {/* Open door, swung toward the viewer, glowing with light from inside */}
        <path d="M 168 138 L 330 168 L 330 470 L 168 472 Z" fill="url(#doorGlow)" />
        {/* Door handle */}
        <circle cx="310" cy="320" r="5" fill="#0d1d2b" opacity="0.6" />

        {/* Threshold step */}
        <rect x="150" y="478" width="200" height="14" rx="2" fill="#5a413a" opacity="0.4" />

        {/* Welcome mat, drawn as a simple dashed-border rectangle at the foot of the door */}
        <rect x="185" y="494" width="130" height="34" rx="3" fill="none" stroke="#ffdbd1" strokeWidth="2" strokeDasharray="4 5" opacity="0.7" />

        {/* A traveler's bag resting on the step */}
        <g transform="translate(120 452)">
          <rect x="0" y="14" width="48" height="38" rx="6" fill="#f7f9ff" opacity="0.92" />
          <rect x="10" y="0" width="28" height="18" rx="6" fill="none" stroke="#f7f9ff" strokeWidth="4" opacity="0.92" />
          <line x1="0" y1="34" x2="48" y2="34" stroke="#0d1d2b" strokeWidth="2" opacity="0.25" />
        </g>

        {/* A small potted plant on the other side of the step -- the detail
            that keeps this a doorstep and not a generic portal. */}
        <g transform="translate(345 440)">
          <path d="M 4 50 L 12 14 L 34 14 L 42 50 Z" fill="#f7f9ff" opacity="0.85" />
          <path d="M 23 14 C 10 4 8 -10 23 -14 C 22 -2 22 8 23 14 Z" fill="#e3beb5" opacity="0.9" />
          <path d="M 23 14 C 34 6 40 -6 30 -16 C 27 -4 24 6 23 14 Z" fill="#e3beb5" opacity="0.75" />
        </g>
      </g>

      {/* Faint stars, kept from the original -- the only element that was
          already doing real work (night sky, distance travelled). Outside the
          scaled group deliberately: a starfield reads fine cropped, so it can
          keep using the full canvas rather than being squeezed too. */}
      {Array.from({ length: 40 }, (_, i) => {
        const x = (i * 137) % 500;
        const y = (i * 71) % 130;
        return <circle key={i} cx={x} cy={y} r="1.2" fill="#ffffff" opacity="0.15" />;
      })}
    </svg>
  );
}
