import {
  getTopTracks,
  getTopArtists,
  getRecentlyPlayed,
  getArtistAlbums,
} from "@/lib/spotify";
import { computeStats, formatRange } from "@/lib/insights";
import { buildSuggestions } from "@/lib/suggestions";
import { signCardPayload } from "@/lib/cardToken";

const SUGGESTION_SEED_ARTISTS = 3;

/**
 * One place that turns a session into everything the dashboard and the
 * card need. Used by app/api/stats/route.js and the dashboard page.
 */
export async function getWeeklyStats(session) {
  // Core stats depend only on /me/* endpoints, which remain available.
  const [recent, topTracksShort, topTracksMedium, topTracksLong, topArtists] =
    await Promise.all([
      getRecentlyPlayed(session),
      getTopTracks(session, "short_term"),
      getTopTracks(session, "medium_term"),
      getTopTracks(session, "long_term"),
      getTopArtists(session, "short_term"),
    ]);

  const stats = computeStats({ recent, topTracks: topTracksShort, topArtists });

  // Suggestions are best-effort: catalog access can be limited for dev-mode
  // apps and endpoints change, so a failure here must never blank the page.
  let suggestions = [];
  try {
    const artistCatalog = await fetchArtistCatalog(session, topArtists);
    suggestions = buildSuggestions({
      recent,
      topTracksShort,
      topTracksMedium,
      topTracksLong,
      artistCatalog,
    });
  } catch {
    suggestions = [];
  }

  return {
    user: session.user,
    rangeLabel: formatRange(stats.range),
    stats,
    suggestions,
    cardToken: await mintCardToken(session.user, stats),
  };
}

// Fresh-drop seeds: each artist's albums, fetched independently so one
// artist's failure drops only that artist, not the whole batch.
async function fetchArtistCatalog(session, topArtists) {
  const seeds = (topArtists?.items ?? []).slice(0, SUGGESTION_SEED_ARTISTS);
  const results = await Promise.all(
    seeds.map(async (artist) => {
      try {
        return { artist, albums: await getArtistAlbums(session, artist.id) };
      } catch {
        return { artist, albums: null };
      }
    })
  );
  return results;
}

export function mintCardToken(user, stats) {
  return signCardPayload({
    name: user?.name ?? "you",
    rangeLabel: formatRange(stats.range),
    minutes: stats.minutes,
    playCount: stats.playCount,
    uniqueArtists: stats.uniqueArtists,
    topTrackName: stats.topTrack?.name ?? "—",
    topTrackArtist: stats.topTrack?.artist ?? "",
    topTrackArt: stats.topTrack?.art ?? null,
    topArtistName: stats.topArtist?.name ?? "—",
    replayCount: stats.replayCount,
    busiestDay: stats.busiestDay?.name ?? null,
    personality: stats.personality,
    seed: (user?.id ?? "wrapped").split("").reduce((h, c) => h + c.charCodeAt(0), 0),
  });
}
