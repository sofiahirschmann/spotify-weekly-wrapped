const API_BASE = "https://api.spotify.com/v1";
const TOKEN_URL = "https://accounts.spotify.com/api/token";

export class SpotifyError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "SpotifyError";
    this.status = status;
  }
}

async function refreshAccessToken(session) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: session.refreshToken,
      client_id: process.env.SPOTIFY_CLIENT_ID,
    }),
  });
  if (!res.ok) {
    throw new SpotifyError("Token refresh failed — user must log in again", res.status);
  }
  const data = await res.json();
  session.accessToken = data.access_token;
  if (data.refresh_token) session.refreshToken = data.refresh_token;
  session.expiresAt = Date.now() + data.expires_in * 1000 - 60_000;
  await session.save();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Single fetch path for every Spotify call.
 * 401 → refresh the token once, retry once, then fail loudly.
 * 429 → wait out Retry-After once (if short), never loop.
 */
async function spotifyFetch(session, path, { refreshed = false, waited = false } = {}) {
  if (session.expiresAt && Date.now() >= session.expiresAt && !refreshed) {
    await refreshAccessToken(session);
    refreshed = true;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  if (res.status === 401 && !refreshed) {
    await refreshAccessToken(session);
    return spotifyFetch(session, path, { refreshed: true, waited });
  }

  if (res.status === 429 && !waited) {
    const retryAfter = Number(res.headers.get("retry-after") ?? 1);
    if (retryAfter <= 30) {
      await sleep(retryAfter * 1000);
      return spotifyFetch(session, path, { refreshed, waited: true });
    }
  }

  if (!res.ok) {
    throw new SpotifyError(`Spotify request failed: ${path}`, res.status);
  }
  return res.json();
}

export function getTopTracks(session, timeRange = "short_term", limit = 50) {
  return spotifyFetch(session, `/me/top/tracks?time_range=${timeRange}&limit=${limit}`);
}

export function getTopArtists(session, timeRange = "short_term", limit = 20) {
  return spotifyFetch(session, `/me/top/artists?time_range=${timeRange}&limit=${limit}`);
}

export function getRecentlyPlayed(session, limit = 50) {
  return spotifyFetch(session, `/me/player/recently-played?limit=${limit}`);
}

export function getArtistTopTracks(session, artistId) {
  return spotifyFetch(session, `/artists/${artistId}/top-tracks?market=from_token`);
}

export function getArtistAlbums(session, artistId, limit = 10) {
  return spotifyFetch(
    session,
    `/artists/${artistId}/albums?include_groups=album,single&limit=${limit}`
  );
}
