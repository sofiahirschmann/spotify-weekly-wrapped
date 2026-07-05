import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getOauthSession } from "@/lib/session";

const SCOPES = "user-top-read user-read-recently-played";

export async function GET(request) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "SPOTIFY_CLIENT_ID and SPOTIFY_REDIRECT_URI must be set" },
      { status: 500 }
    );
  }

  const verifier = crypto.randomBytes(48).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  const state = crypto.randomBytes(16).toString("base64url");

  const oauth = await getOauthSession();
  oauth.verifier = verifier;
  oauth.state = state;
  await oauth.save();

  const authorizeUrl = new URL("https://accounts.spotify.com/authorize");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", SCOPES);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("code_challenge", challenge);

  return NextResponse.redirect(authorizeUrl);
}
