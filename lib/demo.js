import { formatRange, personalityLine } from "@/lib/insights";
import { mintCardToken } from "@/lib/stats";

/**
 * Fixture data for developing the UI without a Spotify login
 * (dev-mode apps only allow allowlisted users). Enabled only when
 * DEMO=1 and never in production. Art is null on purpose — it
 * exercises the same fallbacks real thin data hits.
 */

export function demoEnabled() {
  return process.env.DEMO === "1" && process.env.NODE_ENV !== "production";
}

const WEEK_MS = 7 * 86_400_000;

export async function getDemoStats() {
  const to = Date.now();
  const range = { from: to - WEEK_MS, to };

  const track = (name, artist, minutes = 3.4) => ({
    id: `demo-${name.toLowerCase().replace(/\W+/g, "-")}`,
    name,
    artist,
    art: null,
    url: null,
    durationMs: Math.round(minutes * 60_000),
  });

  const stats = {
    minutes: 412,
    playCount: 50,
    uniqueTracks: 31,
    uniqueArtists: 12,
    topTrack: track("Golden Hour Static", "Neon Grove"),
    topArtist: { id: "demo-neon-grove", name: "Neon Grove", plays: 14, art: null },
    replayCount: 11,
    replayPeakDay: { name: "Tuesday", count: 6 },
    busiestDay: { name: "Tuesday", count: 17 },
    lateNightPlays: 4,
    topTracksOfWeek: [
      { ...track("Golden Hour Static", "Neon Grove"), plays: 11 },
      { ...track("Blue Milk", "Cassette Fauna"), plays: 6 },
      { ...track("Dial Tone Romance", "Marble Arcade"), plays: 5 },
      { ...track("Sunroof Weather", "Neon Grove", 2.9), plays: 4 },
      { ...track("Corduroy", "Pale Motel", 4.1), plays: 3 },
      { ...track("Anywhere but Tuesday", "Cassette Fauna", 3.1), plays: 3 },
      { ...track("Glass Orchard", "Marble Arcade", 3.8), plays: 2 },
      { ...track("Last Exit Lullaby", "Pale Motel", 3.6), plays: 2 },
    ],
    fourWeekTop: track("Blue Milk", "Cassette Fauna"),
    range,
  };
  stats.personality = personalityLine(stats);

  const suggestion = (name, artist, kind, reason) => ({
    ...track(name, artist),
    kind,
    reason,
  });

  const vaultReason = "One of your all-time favorites, gone quiet lately";
  const suggestions = [
    suggestion("Vermilion Sky", "Neon Grove", "fresh", "Neon Grove dropped this 5 days ago"),
    suggestion("Slow Elevator", "Cassette Fauna", "rediscovery", "Your soundtrack a few months back"),
    suggestion("Petrichor", "Neon Grove", "vault", vaultReason),
    suggestion("Night Bus Home", "Marble Arcade", "rediscovery", "Your soundtrack a few months back"),
    suggestion("Low Tide", "Cassette Fauna", "vault", vaultReason),
    suggestion("Second Summer", "Marble Arcade", "fresh", "Marble Arcade dropped this 12 days ago"),
  ];

  const user = { id: "demo-user", name: "Demo", avatar: null };

  return {
    user,
    rangeLabel: formatRange(range),
    stats,
    suggestions,
    cardToken: await mintCardToken(user, stats),
    demo: true,
  };
}
