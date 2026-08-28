/**
 * Generates every app/PWA icon and splash asset from one vector source, so
 * the brand mark lives in exactly one place. Re-run after changing the mark:
 *
 *   node scripts/generate-icons.mjs
 *
 * The mark echoes RouteMapIllustration (src/components/RouteMapIllustration.tsx):
 * three city nodes joined by travel routes. Strokes are solid here rather than
 * dashed like the hero -- dashes disappear entirely at 16px favicon size.
 */
import sharp from "sharp";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");

const BLUE = "#b22c00"; // M3 primary (rust) -- name kept, value now the v4 brand
const INK = "#0d1d2b";
const WHITE = "#ffffff";

// Drawn against a 1024 canvas. STROKE is the route weight; node radii and
// half the stroke both stick out past the path coordinates, so the visual
// bounding box below is derived from them rather than from the raw points.
const STROKE = 30;
const NODES = [
  { x: 330, y: 690, r: 62 },
  { x: 512, y: 330, r: 74 },
  { x: 700, y: 640, r: 54 },
];
const PATHS = [
  "M 330 690 Q 360 480 512 330",
  "M 512 330 Q 668 404 700 640",
  "M 700 640 Q 515 732 330 690",
];

const BOX = (() => {
  const pad = (n) => Math.max(n.r, STROKE / 2);
  const xs = NODES.flatMap((n) => [n.x - pad(n), n.x + pad(n)]);
  const ys = NODES.flatMap((n) => [n.y - pad(n), n.y + pad(n)]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, size: Math.max(maxX - minX, maxY - minY) };
})();

function markBody(fg) {
  return `<g stroke="${fg}" stroke-width="${STROKE}" stroke-linecap="round" fill="none">
      ${PATHS.map((d) => `<path d="${d}"/>`).join("\n      ")}
    </g>
    ${NODES.map((n) => `<circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="${fg}"/>`).join("\n    ")}`;
}

/**
 * Scales the mark about its own visual center so `fill` means "the mark
 * occupies this fraction of the canvas" -- otherwise a raw scale() reads far
 * smaller than expected, since the art only spans about half the 1024 box.
 *
 * @param {object} opts
 * @param {string|null} opts.bg   Background fill, or null for transparent.
 * @param {string} opts.fg        Mark color.
 * @param {number} opts.fill      Fraction of the canvas the mark should span.
 */
function markSvg({ bg, fg, fill }) {
  const s = (fill * 1024) / BOX.size;
  const tx = 512 - s * BOX.cx;
  const ty = 512 - s * BOX.cy;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : ""}
  <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})">
    ${markBody(fg)}
  </g>
</svg>`;
}

/** Centers the mark on a solid background at an arbitrary canvas size. */
function splashSvg({ bg, fg, w, h = w }) {
  // Splash marks sit small: the launch screen is a held breath, not a poster.
  // Scale off the short edge so landscape splashes don't overflow.
  const s = (0.18 * Math.min(w, h)) / BOX.size;
  const tx = w / 2 - s * BOX.cx;
  const ty = h / 2 - s * BOX.cy;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})">
    ${markBody(fg)}
  </g>
</svg>`;
}

/** Pre-rounded variant: Android's ic_launcher_round is NOT auto-masked. */
function roundSvg({ bg, fg, fill }) {
  const s = (fill * 1024) / BOX.size;
  const tx = 512 - s * BOX.cx;
  const ty = 512 - s * BOX.cy;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <circle cx="512" cy="512" r="512" fill="${bg}"/>
  <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})">
    ${markBody(fg)}
  </g>
</svg>`;
}

const png = (svg, w, h = w) =>
  sharp(Buffer.from(svg)).resize(w, h, { fit: "fill" }).png({ compressionLevel: 9 }).toBuffer();

async function writeTo(base, relPath, buf) {
  const full = join(base, relPath);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, buf);
  console.log("  ✓", relPath);
}

const write = (relPath, buf) => writeTo(PUBLIC, relPath, buf);

/**
 * Overwrites the placeholder launcher icons and splash drawables that
 * `cap add android` scaffolds. Regenerated here rather than by hand so the
 * native shell can never drift from the web icons.
 */
async function androidAssets() {
  const ANDROID_RES = join(ROOT, "android", "app", "src", "main", "res");
  if (!existsSync(ANDROID_RES)) {
    console.log("\nAndroid platform not present -- skipping native icons.");
    return;
  }

  const legacy = markSvg({ bg: BLUE, fg: WHITE, fill: 0.62 });
  const round = roundSvg({ bg: BLUE, fg: WHITE, fill: 0.62 });
  const foreground = markSvg({ bg: null, fg: WHITE, fill: 0.46 });

  // Launcher icons are 48dp; adaptive-icon layers are 108dp, hence the two
  // size tables for the same density buckets.
  const LAUNCHER = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  const ADAPTIVE = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };

  console.log("\nAndroid launcher icons:");
  for (const [density, size] of Object.entries(LAUNCHER)) {
    await writeTo(ANDROID_RES, `mipmap-${density}/ic_launcher.png`, await png(legacy, size));
    await writeTo(ANDROID_RES, `mipmap-${density}/ic_launcher_round.png`, await png(round, size));
    await writeTo(
      ANDROID_RES,
      `mipmap-${density}/ic_launcher_foreground.png`,
      await png(foreground, ADAPTIVE[density])
    );
  }

  // The adaptive icon's background layer is a colour resource, not a bitmap.
  await writeTo(
    ANDROID_RES,
    "values/ic_launcher_background.xml",
    Buffer.from(
      `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BLUE}</color>\n</resources>\n`
    )
  );

  console.log("Android splash drawables:");
  const PORT = { mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [960, 1600], xxxhdpi: [1280, 1920] };
  for (const [density, [w, h]] of Object.entries(PORT)) {
    const portrait = splashSvg({ bg: WHITE, fg: BLUE, w, h });
    const landscape = splashSvg({ bg: WHITE, fg: BLUE, w: h, h: w });
    await writeTo(ANDROID_RES, `drawable-port-${density}/splash.png`, await png(portrait, w, h));
    await writeTo(ANDROID_RES, `drawable-land-${density}/splash.png`, await png(landscape, h, w));
  }
  await writeTo(ANDROID_RES, "drawable/splash.png", await png(splashSvg({ bg: WHITE, fg: BLUE, w: 480, h: 800 }), 480, 800));
}

async function main() {
  // Full-bleed: iOS requires an opaque square with no transparency and no
  // pre-rounded corners -- the OS applies its own mask.
  const fullBleed = markSvg({ bg: BLUE, fg: WHITE, fill: 0.62 });
  // Maskable/adaptive: content must survive an aggressive circular crop, so
  // the mark is padded well inside the 80%-diameter safe zone.
  const maskable = markSvg({ bg: BLUE, fg: WHITE, fill: 0.46 });
  const adaptiveFg = markSvg({ bg: null, fg: WHITE, fill: 0.46 });

  console.log("Icons:");
  await write("icon-192.png", await png(fullBleed, 192));
  await write("icon-512.png", await png(fullBleed, 512));
  await write("icon-maskable-512.png", await png(maskable, 512));
  await write("apple-touch-icon.png", await png(fullBleed, 180));
  await write("icon-1024.png", await png(fullBleed, 1024));

  console.log("Android adaptive layers:");
  await write("android/icon-foreground.png", await png(adaptiveFg, 1024));
  await write("android/icon-background.png", await png(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${BLUE}"/></svg>`, 1024));

  console.log("Splash:");
  await write("splash.png", await png(splashSvg({ bg: WHITE, fg: BLUE, w: 2732 }), 2732));
  await write("splash-dark.png", await png(splashSvg({ bg: INK, fg: WHITE, w: 2732 }), 2732));

  // Multi-resolution favicon so the tab icon stays crisp at every size the
  // browser picks from.
  console.log("Favicon:");
  await write("favicon.ico", await sharp(Buffer.from(fullBleed)).resize(48, 48).toFormat("png").toBuffer());

  // Open Graph / Twitter card image. Deliberately mark-only, no wordmark or
  // tagline baked in as raster text: this environment has no real font
  // available to sharp/librsvg (system "sans-serif" resolves to a crude
  // monospace fallback -- confirmed by rendering a test string), and every
  // OG consumer (Slack, Twitter, iMessage, Facebook) already renders the
  // page's actual title/description as real, selectable text next to the
  // image. Baking in blurry fallback-font text would look broken; the brand
  // mark alone reads fine at social-preview size.
  console.log("Social preview:");
  const OG_W = 1200, OG_H = 630;
  // Single translate+scale mapping BOX's own center directly to the canvas
  // center, same approach as markSvg() above but against a 1200x630 canvas
  // instead of a 1024 square -- fill is relative to the short edge (height)
  // so the mark can never overflow top-to-bottom.
  const ogFill = 0.62;
  const ogScale = (ogFill * OG_H) / BOX.size;
  const ogTx = OG_W / 2 - ogScale * BOX.cx;
  const ogTy = OG_H / 2 - ogScale * BOX.cy;
  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}" viewBox="0 0 ${OG_W} ${OG_H}">
  <rect width="${OG_W}" height="${OG_H}" fill="${BLUE}"/>
  <g transform="translate(${ogTx.toFixed(2)} ${ogTy.toFixed(2)}) scale(${ogScale.toFixed(4)})">${markBody(WHITE)}</g>
</svg>`;
  await write("og-image.png", await png(ogSvg, OG_W, OG_H));

  await androidAssets();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
