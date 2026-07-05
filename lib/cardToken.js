import { SignJWT, jwtVerify } from "jose";

/**
 * The card route never receives raw stats or tokens in query params —
 * it takes this short-lived HMAC-signed payload minted by the stats layer.
 */

function key() {
  return new TextEncoder().encode(process.env.SESSION_SECRET);
}

export async function signCardPayload(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(key());
}

export async function verifyCardPayload(token) {
  const { payload } = await jwtVerify(token, key());
  return payload;
}
