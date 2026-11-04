/** Clinic photos are served from Supabase Storage; allow exactly that host for next/image. */
function supabaseImagePattern() {
  try {
    const url = new URL(process.env.SUPABASE_URL ?? "");
    return [{ protocol: url.protocol.replace(":", ""), hostname: url.hostname, port: url.port, pathname: "/storage/v1/object/public/**" }];
  } catch {
    return [{ protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" }];
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // Never serve a cached copy of a dynamic page on client-side navigation: the
  // dashboard must reflect a site generated or a plan bought a moment ago.
  experimental: { staleTimes: { dynamic: 0 } },
  images: {
    remotePatterns: [
      ...supabaseImagePattern(),
      { protocol: "https", hostname: "**.googleapis.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
