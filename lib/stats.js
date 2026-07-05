import {
  getTopTracks,
  getTopArtists,
  getRecentlyPlayed,
  getArtistTopTracks,
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
  const [recent, topTracksShort, topTracksMedium, topArtists] = await Promise.all([
    getRecentlyPlayed(session),
    getTopTracks(session, "short_term"),
    getTopTracks(session, "medium_term"),
    getTopArtists(session, "short_term"),
  ]);

  const seeds = (topArtists?.items ?? []).slice(0, SUGGESTION_SEED_ARTISTS);
  const artistCatalog = await Promise.all(
    seeds.map(async (artist) => {
      const [topTracks, albums] = await Promise.all([
        getArtistTopTracks(session, artist.id),
        getArtistAlbums(session, artist.id),
      ]);
      return { artist, topTracks, albums };
    })
  );

  const stats = computeStats({ recent, topTracks: topTracksShort, topArtists });
  const suggestions = buildSuggestions({
    recent,
    topTracksShort,
    topTracksMedium,
    artistCatalog,
  });

  return {
    user: session.user,
    rangeLabel: formatRange(stats.range),
    stats,
    suggestions,
    cardToken: await mintCardToken(session.user, stats),
  };
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
