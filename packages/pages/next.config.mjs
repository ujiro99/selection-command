/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: process.env.NODE_ENV === "production" ? "export" : "standalone",
  // Note: This headers() config is only effective in development (standalone mode).
  // In production (output: "export"), static files are served without Next.js server,
  // so CORS headers must be configured at the hosting level (e.g. Vercel, Nginx).
  async headers() {
    return [
      {
        source: "/data/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
    ]
  },
}

export default nextConfig
