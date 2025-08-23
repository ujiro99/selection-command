/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: process.env.NODE_ENV === "production" ? "export" : "standalone",
}

export default nextConfig
