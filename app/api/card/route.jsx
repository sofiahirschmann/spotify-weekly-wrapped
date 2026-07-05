import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { verifyCardPayload } from "@/lib/cardToken";

export const runtime = "nodejs";

/**
 * The shareable card. Two formats, one file, shared components:
 *   ?format=story    1080x1920 (default)
 *   ?format=preview  1200x630
 * Takes a signed payload token — never raw stats or tokens in the URL.
 */

const INK = "#121212";

// Wrapped-style duotone pairs; black ink on top of all of them.
const PALETTES = [
  { from: "#F037A5", to: "#FF6437" }, // pink → orange
  { from: "#509BF5", to: "#CDF564" }, // blue → lime
  { from: "#CDF564", to: "#F037A5" }, // lime → pink
  { from: "#FF6437", to: "#F037A5" }, // orange → pink
];

const fontCache = new Map();
function font(file) {
  if (!fontCache.has(file)) {
    fontCache.set(file, fs.readFileSync(path.join(process.cwd(), "assets/fonts", file)));
  }
  return fontCache.get(file);
}

const FONTS = () => [
  { name: "Figtree", data: font("Figtree-Regular.ttf"), weight: 400, style: "normal" },
  { name: "Figtree", data: font("Figtree-Bold.ttf"), weight: 700, style: "normal" },
  { name: "Figtree", data: font("Figtree-Black.ttf"), weight: 900, style: "normal" },
];

/* ---------- shared components ---------- */

function Eyebrow({ children, size = 30 }) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: size,
        fontWeight: 900,
        letterSpacing: size * 0.22,
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

function ArtBlock({ src, name, size }) {
  const frame = {
    width: size,
    height: size,
    borderRadius: 20,
    border: `${Math.round(size * 0.014)}px solid ${INK}`,
    boxShadow: `${size * 0.05}px ${size * 0.05}px 0 ${INK}`,
  };
  if (src) {
    return <img src={src} width={size} height={size} style={frame} />;
  }
  return (
    <div
      style={{
        ...frame,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: INK,
        color: "#FFFFFF",
        fontSize: size * 0.5,
        fontWeight: 900,
      }}
    >
      {(name ?? "♪").slice(0, 1).toUpperCase()}
    </div>
  );
}

function StatCell({ value, label, valueSize = 84, labelSize = 26 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", fontSize: valueSize, fontWeight: 900, lineHeight: 1 }}>
        {value}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: labelSize,
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: "uppercase",
          opacity: 0.72,
          marginTop: 8,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function PersonalityChip({ children, fontSize = 40, padding = "34px 42px" }) {
  return (
    <div
      style={{
        display: "flex",
        backgroundColor: INK,
        color: "#FFFFFF",
        borderRadius: 28,
        padding,
        fontSize,
        fontWeight: 700,
        lineHeight: 1.25,
      }}
    >
      {children}
    </div>
  );
}

function Footer({ size = 26 }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        fontSize: size,
      }}
    >
      <div style={{ display: "flex", opacity: 0.7, fontWeight: 400 }}>
        *based on your last 50 plays
      </div>
      <div style={{ display: "flex", alignItems: "center", fontWeight: 900 }}>
        <div
          style={{
            display: "flex",
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: 999,
            backgroundColor: INK,
            marginRight: 10,
          }}
        />
        weekly wrapped
      </div>
    </div>
  );
}

/* ---------- layouts ---------- */

function StoryCard({ card, palette }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: 88,
        color: INK,
        fontFamily: "Figtree",
        background: `linear-gradient(160deg, ${palette.from} 0%, ${palette.to} 100%)`,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Eyebrow size={34}>your weekly wrapped</Eyebrow>
        <div style={{ display: "flex", fontSize: 32, fontWeight: 700, opacity: 0.8, marginTop: 14 }}>
          {card.rangeLabel} · {card.name}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <ArtBlock src={card.topTrackArt} name={card.topTrackName} size={440} />
        <div
          style={{
            display: "flex",
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: "uppercase",
            opacity: 0.72,
            marginTop: 44,
          }}
        >
          top track
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 74,
            fontWeight: 900,
            lineHeight: 1.04,
            marginTop: 10,
          }}
        >
          {card.topTrackName}
        </div>
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700, opacity: 0.85, marginTop: 8 }}>
          {card.topTrackArtist}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", width: "100%" }}>
        <div style={{ display: "flex", width: "50%", marginBottom: 52 }}>
          <StatCell value={`${card.minutes}`} label="minutes*" />
        </div>
        <div style={{ display: "flex", width: "50%", marginBottom: 52 }}>
          <StatCell value={`${card.replayCount}×`} label="one song, replayed" />
        </div>
        <div style={{ display: "flex", width: "50%" }}>
          <StatCell value={`${card.uniqueArtists}`} label="artists" />
        </div>
        <div style={{ display: "flex", width: "50%" }}>
          <StatCell value={card.busiestDay ?? "—"} label="busiest day" valueSize={64} />
        </div>
      </div>

      <PersonalityChip>{card.personality}</PersonalityChip>

      <Footer />
    </div>
  );
}

function PreviewCard({ card, palette }) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        padding: 56,
        color: INK,
        fontFamily: "Figtree",
        background: `linear-gradient(120deg, ${palette.from} 0%, ${palette.to} 100%)`,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flexGrow: 1,
          paddingRight: 48,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Eyebrow size={22}>your weekly wrapped</Eyebrow>
          <div style={{ display: "flex", fontSize: 20, fontWeight: 700, opacity: 0.8, marginTop: 8 }}>
            {card.rangeLabel} · {card.name}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 52,
              fontWeight: 900,
              lineHeight: 1.05,
              marginTop: 24,
            }}
          >
            {card.topTrackName}
          </div>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 700, opacity: 0.85, marginTop: 6 }}>
            {card.topTrackArtist}
          </div>
        </div>

        <div style={{ display: "flex" }}>
          <div style={{ display: "flex", marginRight: 64 }}>
            <StatCell value={`${card.minutes}`} label="minutes*" valueSize={54} labelSize={18} />
          </div>
          <div style={{ display: "flex", marginRight: 64 }}>
            <StatCell value={`${card.replayCount}×`} label="replays" valueSize={54} labelSize={18} />
          </div>
          <div style={{ display: "flex" }}>
            <StatCell value={`${card.uniqueArtists}`} label="artists" valueSize={54} labelSize={18} />
          </div>
        </div>

        <Footer size={20} />
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        <ArtBlock src={card.topTrackArt} name={card.topTrackName} size={340} />
      </div>
    </div>
  );
}

/* ---------- route ---------- */

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const format = searchParams.get("format") === "preview" ? "preview" : "story";

  let card;
  try {
    card = await verifyCardPayload(token ?? "");
  } catch {
    return new Response("Invalid or expired card token", { status: 401 });
  }

  const palette = PALETTES[(card.seed ?? 0) % PALETTES.length];
  const [width, height] = format === "preview" ? [1200, 630] : [1080, 1920];
  const element =
    format === "preview" ? (
      <PreviewCard card={card} palette={palette} />
    ) : (
      <StoryCard card={card} palette={palette} />
    );

  return new ImageResponse(element, {
    width,
    height,
    fonts: FONTS(),
    headers: {
      "Content-Disposition": `inline; filename="weekly-wrapped-${format}.png"`,
      "Cache-Control": "private, max-age=600",
    },
  });
}
