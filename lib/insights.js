/**
 * Pure functions turning raw Spotify API data into the fun derived stats.
 * All personality copy lives here as data + templates, never in JSX.
 *
 * Honesty rule: recently-played only covers the last 50 plays, so every
 * weekly number is an estimate and is labeled as such downstream.
 */

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function primaryArtist(track) {
  return track.artists?.[0] ?? { id: null, name: "Unknown artist" };
}

function albumArt(track, size = 1) {
  // images come largest-first; index 1 is the 300px variant
  return track.album?.images?.[size]?.url ?? track.album?.images?.[0]?.url ?? null;
}

export function trackSummary(track) {
  if (!track) return null;
  return {
    id: track.id,
    name: track.name,
    artist: track.artists?.map((a) => a.name).join(", ") ?? "",
    art: albumArt(track),
    url: track.external_urls?.spotify ?? null,
    durationMs: track.duration_ms ?? 0,
  };
}

export function computeStats({ recent, topTracks, topArtists }) {
  const plays = recent?.items ?? [];

  const byTrack = new Map();
  const byArtist = new Map();
  const byDay = new Map();
  let totalMs = 0;
  let lateNightPlays = 0;

  for (const { track, played_at } of plays) {
    if (!track) continue;
    totalMs += track.duration_ms ?? 0;

    const t = byTrack.get(track.id) ?? { track, count: 0, days: new Map() };
    t.count += 1;
    const artist = primaryArtist(track);
    const a = byArtist.get(artist.id) ?? { artist, count: 0 };
    a.count += 1;
    byArtist.set(artist.id, a);

    const playedAt = new Date(played_at);
    const day = DAY_NAMES[playedAt.getUTCDay()];
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
    t.days.set(day, (t.days.get(day) ?? 0) + 1);
    byTrack.set(track.id, t);

    const hour = playedAt.getUTCHours();
    if (hour >= 0 && hour < 5) lateNightPlays += 1;
  }

  const maxBy = (map, key) =>
    [...map.values()].reduce((best, cur) => (cur[key] > (best?.[key] ?? -1) ? cur : best), null);

  const topPlayed = maxBy(byTrack, "count");
  const topArtistPlayed = maxBy(byArtist, "count");
  const busiestDay = [...byDay.entries()].reduce(
    (best, [name, count]) => (count > (best?.count ?? -1) ? { name, count } : best),
    null
  );

  // Fall back to the ~4-week top lists when the recent window is thin.
  const topTrack = topPlayed?.track ?? topTracks?.items?.[0] ?? null;
  const fallbackArtist = topArtists?.items?.[0]
    ? { artist: topArtists.items[0], count: 0 }
    : null;
  const topArtistEntry = topArtistPlayed ?? fallbackArtist;

  const replayCount = topPlayed?.count ?? 0;
  const replayPeakDay = topPlayed
    ? [...topPlayed.days.entries()].reduce(
        (best, [name, count]) => (count > (best?.count ?? -1) ? { name, count } : best),
        null
      )
    : null;

  const artistImage = (artist) =>
    topArtists?.items?.find((a) => a.id === artist?.id)?.images?.[1]?.url ??
    artist?.images?.[1]?.url ??
    null;

  const timestamps = plays.map((p) => new Date(p.played_at).getTime());
  const range = timestamps.length
    ? { from: Math.min(...timestamps), to: Math.max(...timestamps) }
    : { from: Date.now(), to: Date.now() };

  const topTracksOfWeek = [...byTrack.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map(({ track, count }) => ({ ...trackSummary(track), plays: count }));

  const stats = {
    minutes: Math.round(totalMs / 60_000),
    playCount: plays.length,
    uniqueTracks: byTrack.size,
    uniqueArtists: byArtist.size,
    topTrack: trackSummary(topTrack),
    topArtist: topArtistEntry
      ? {
          id: topArtistEntry.artist.id,
          name: topArtistEntry.artist.name,
          plays: topArtistEntry.count,
          art: artistImage(topArtistEntry.artist),
        }
      : null,
    replayCount,
    replayPeakDay,
    busiestDay,
    lateNightPlays,
    topTracksOfWeek,
    fourWeekTop: trackSummary(topTracks?.items?.[0] ?? null),
    range,
  };

  return { ...stats, personality: personalityLine(stats) };
}

/**
 * Personality templates, checked in order — first match wins.
 * Keep copy here as data; the UI and the card only ever print the result.
 */
const PERSONALITY_TEMPLATES = [
  {
    id: "single-day-obsession",
    when: (s) => s.replayCount >= 6 && (s.replayPeakDay?.count ?? 0) >= 4,
    text: (s) =>
      `You played “${s.topTrack.name}” ${s.replayCount} times — ${s.replayPeakDay.name} hit different.`,
  },
  {
    id: "repeat-offender",
    when: (s) => s.replayCount >= 5,
    text: (s) => `“${s.topTrack.name}” ${s.replayCount} times. We're not judging. Much.`,
  },
  {
    id: "night-owl",
    when: (s) => s.lateNightPlays >= 10 && s.topArtist,
    text: (s) => `You and ${s.topArtist.name} closed out more than one night this week.`,
  },
  {
    id: "loyalist",
    when: (s) => s.uniqueArtists > 0 && s.uniqueArtists <= 6,
    text: (s) => `${s.uniqueArtists} artists all week. You know what you like.`,
  },
  {
    id: "explorer",
    when: (s) => s.uniqueArtists >= 25,
    text: (s) => `${s.uniqueArtists} different artists in one week — your algorithm can't keep up.`,
  },
  {
    id: "one-day-wonder",
    when: (s) => s.busiestDay && s.playCount > 0 && s.busiestDay.count / s.playCount >= 0.5,
    text: (s) => `Half your week's listening happened on ${s.busiestDay.name}. Big day.`,
  },
  {
    id: "default",
    when: () => true,
    text: (s) => `${s.uniqueTracks} tracks, ${s.uniqueArtists} artists — a balanced musical diet.`,
  },
];

export function personalityLine(stats) {
  if (!stats.topTrack) return "A quiet week. The comeback starts now.";
  return PERSONALITY_TEMPLATES.find((t) => t.when(stats)).text(stats);
}

export function formatRange({ from, to }) {
  const fmt = (ts) =>
    new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(from)} – ${fmt(to)}`;
}
