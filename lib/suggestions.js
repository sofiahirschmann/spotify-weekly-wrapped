/**
 * Song suggestions derived from the user's own listening data.
 *
 * Spotify deprecated /recommendations (Nov 2024) and removed artist
 * top-tracks (Feb 2026), so every suggestion here comes from endpoints
 * that are still available — the user's own top-tracks windows and their
 * top artists' album releases — and carries an honest reason explaining
 * which signal produced it.
 */

import { trackSummary } from "@/lib/insights";

const FRESH_WINDOW_DAYS = 28;
const MAX_SUGGESTIONS = 10;

// Reason copy as data, one template per engine.
const REASONS = {
  rediscovery: () => "Your soundtrack a few months back",
  vault: () => "One of your all-time favorites, gone quiet lately",
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
 * @param topTracksLong   top tracks, long_term (~all time)
 * @param artistCatalog [{ artist, albums }] for the user's top artists
 */
export function buildSuggestions({
  recent,
  topTracksShort,
  topTracksMedium,
  topTracksLong,
  artistCatalog,
}) {
  const recentIds = new Set((recent?.items ?? []).map((p) => p.track?.id).filter(Boolean));
  const shortIds = new Set((topTracksShort?.items ?? []).map((t) => t.id));
  const mediumIds = new Set((topTracksMedium?.items ?? []).map((t) => t.id));

  // Rediscoveries: 6-month favorites that fell out of recent rotation.
  const rediscoveries = (topTracksMedium?.items ?? [])
    .filter((t) => !recentIds.has(t.id) && !shortIds.has(t.id))
    .map((t) => ({ ...trackSummary(t), kind: "rediscovery", reason: REASONS.rediscovery() }));

  // Vault: all-time staples you haven't touched recently or this season.
  const vault = (topTracksLong?.items ?? [])
    .filter((t) => !recentIds.has(t.id) && !shortIds.has(t.id) && !mediumIds.has(t.id))
    .map((t) => ({ ...trackSummary(t), kind: "vault", reason: REASONS.vault() }));

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
  const buckets = [freshDrops, rediscoveries, vault];
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
