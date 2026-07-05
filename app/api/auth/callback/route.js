import { NextResponse } from "next/server";
import { getOauthSession, getSession } from "@/lib/session";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const denied = searchParams.get("error");

  if (denied) {
    return NextResponse.redirect(new URL(`/?error=${denied}`, origin));
  }

  const oauth = await getOauthSession();
  if (!code || !state || !oauth.verifier || state !== oauth.state) {
    return NextResponse.redirect(new URL("/?error=state_mismatch", origin));
  }
  const verifier = oauth.verifier;
  oauth.destroy();

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      client_id: process.env.SPOTIFY_CLIENT_ID,
      code_verifier: verifier,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/?error=token_exchange_failed", origin));
  }

  const tokens = await tokenRes.json();

  const profileRes = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile = profileRes.ok ? await profileRes.json() : {};

  const session = await getSession();
  session.accessToken = tokens.access_token;
  session.refreshToken = tokens.refresh_token;
  // Refresh a minute early so requests never race the expiry.
  session.expiresAt = Date.now() + tokens.expires_in * 1000 - 60_000;
  session.user = {
    id: profile.id ?? null,
    name: profile.display_name ?? "you",
    avatar: profile.images?.[0]?.url ?? null,
  };
  await session.save();

  return NextResponse.redirect(new URL("/dashboard", origin));
}
