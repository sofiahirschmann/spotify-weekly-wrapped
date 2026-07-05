/** @type {import('next').NextConfig} */
const nextConfig = {
  // Spotify requires the 127.0.0.1 redirect URI (localhost is rejected for
  // new apps), so dev is browsed via 127.0.0.1 — allow it explicitly or
  // Next blocks the HMR socket and hydration stalls.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
