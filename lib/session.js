import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

const SESSION_COOKIE = "ww_session";
const OAUTH_COOKIE = "ww_oauth";

function sessionPassword() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters");
  }
  return secret;
}

/**
 * Main session: Spotify tokens + basic profile.
 * Shape: { accessToken, refreshToken, expiresAt, user: { id, name, avatar } }
 */
export async function getSession() {
  return getIronSession(await cookies(), {
    cookieName: SESSION_COOKIE,
    password: sessionPassword(),
    ttl: 60 * 60 * 24 * 30,
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  });
}

/**
 * Transient session for the OAuth handshake: PKCE verifier + state.
 * Lives ten minutes, destroyed in the callback.
 */
export async function getOauthSession() {
  return getIronSession(await cookies(), {
    cookieName: OAUTH_COOKIE,
    password: sessionPassword(),
    ttl: 60 * 10,
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  });
}

export function isLoggedIn(session) {
  return Boolean(session.accessToken && session.refreshToken);
}
