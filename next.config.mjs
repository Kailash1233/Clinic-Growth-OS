/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // Frontend-only build: no server at all, so this exports to plain static
  // HTML/CSS/JS — deployable to any static host (Vercel static, Netlify,
  // GitHub Pages, S3, ...), no serverless functions, no database, no env
  // vars required.
  output: "export",
  images: {
    // Static export has no server to run Next's image optimizer; images
    // are served as-is. They're already compressed in /public/images.
    unoptimized: true,
  },
};

export default nextConfig;
