/**
 * Song suggestions derived from the user's own listening data.
 *
 * Spotify deprecated /recommendations for apps created after Nov 2024,
 * so every suggestion here comes from still-available endpoints and
 * carries an honest reason explaining which signal produced it.
 */

import { trackSummary } from "@/lib/insights";

const FRESH_WINDOW_DAYS = 28;
const MAX_SUGGESTIONS = 10;

// Reason copy as data, one template per engine.
const REASONS = {
  rediscovery: () => "Your soundtrack a few months back",
  deepcut: (artistName) => `Because you can't stop playing ${artistName}`,
  fresh: (artistName, daysAgo) =>
    daysAgo <= 1 ? `${artistName} dropped this yesterday` : `${artistName} dropped this ${daysAgo} days ago`,
};

function daysSince(releaseDate) {
  // release_date precision can be year/month/day; coarse dates parse to the 1st.
  return Math.floor((Date.now() - new Date(releaseDate).getTime()) / 86_400_000);
}

/**
 * @param recent        recently-played response (last 50 plays)
 * @param topTracksShort  top tracks, short_term (~4 weeks)
 * @param topTracksMedium top tracks, medium_term (~6 months)
 * @param artistCatalog [{ artist, topTracks, albums }] for the user's top artists
 */
export function buildSuggestions({ recent, topTracksShort, topTracksMedium, artistCatalog }) {
  const recentIds = new Set((recent?.items ?? []).map((p) => p.track?.id).filter(Boolean));
  const shortIds = new Set((topTracksShort?.items ?? []).map((t) => t.id));
  const knownIds = new Set([...recentIds, ...shortIds]);

  const rediscoveries = (topTracksMedium?.items ?? [])
    .filter((t) => !recentIds.has(t.id) && !shortIds.has(t.id))
    .map((t) => ({ ...trackSummary(t), kind: "rediscovery", reason: REASONS.rediscovery() }));

  const deepCuts = (artistCatalog ?? []).flatMap(({ artist, topTracks }) =>
    (topTracks?.tracks ?? [])
      .filter((t) => !knownIds.has(t.id))
      .slice(0, 3)
      .map((t) => ({ ...trackSummary(t), kind: "deepcut", reason: REASONS.deepcut(artist.name) }))
  );

  const freshDrops = (artistCatalog ?? []).flatMap(({ artist, albums }) =>
    (albums?.items ?? [])
      .filter((album) => {
        const age = daysSince(album.release_date);
        return age >= 0 && age <= FRESH_WINDOW_DAYS;
      })
      .map((album) => ({
        id: album.id,
        name: album.name,
        artist: artist.name,
        art: album.images?.[1]?.url ?? album.images?.[0]?.url ?? null,
        url: album.external_urls?.spotify ?? null,
        kind: "fresh",
        reason: REASONS.fresh(artist.name, daysSince(album.release_date)),
      }))
  );

  // Fresh drops lead (they're timely), then alternate the two memory engines.
  const buckets = [freshDrops, rediscoveries, deepCuts];
  const seen = new Set();
  const suggestions = [];
  for (let i = 0; suggestions.length < MAX_SUGGESTIONS; i++) {
    const bucket = buckets[i % buckets.length];
    const item = bucket.shift();
    if (buckets.every((b) => b.length === 0) && !item) break;
    if (!item) continue;
    const key = `${item.name}::${item.artist}`.toLowerCase();
    if (item.id && !seen.has(item.id) && !seen.has(key)) {
      seen.add(item.id);
      seen.add(key);
      suggestions.push(item);
    }
  }
  return suggestions;
}
