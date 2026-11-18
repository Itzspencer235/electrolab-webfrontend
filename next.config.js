/** @type {import("next").NextConfig} */
const nextConfig = {
  images: {
    // Only hosts we actually serve images from. Allowing "**" turned the
    // image optimizer into an open proxy for any site on the internet.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },            // products, tutorials
      { protocol: "https", hostname: "**.googleusercontent.com" },      // Google avatars
      { protocol: "https", hostname: "platform-lookaside.fbsbx.com" },  // Facebook avatars
      { protocol: "https", hostname: "**.fbcdn.net" },
    ],
  },
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Frame-Options",        value: "SAMEORIGIN" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy",     value: "camera=(), microphone=(), geolocation=()" },
      ],
    }];
  },
}
module.exports = nextConfig
