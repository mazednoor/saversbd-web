import type { NextConfig } from "next";

/**
 * WordPress media host. If you later serve the site from a different domain
 * (e.g. cdn.yourdomain.com), add it here too.
 */
const wpUrl = new URL(process.env.WORDPRESS_URL ?? "https://saversbd.com");

const nextConfig: NextConfig = {
  // `standalone` produces a self-contained server bundle for cPanel/Passenger,
  // PM2, Docker or any Node host. Enable it with BUILD_STANDALONE=1.
  output: process.env.BUILD_STANDALONE ? "standalone" : undefined,

  images: {
    remotePatterns: [
      {
        protocol: wpUrl.protocol.replace(":", "") as "http" | "https",
        hostname: wpUrl.hostname,
      },
      // WordPress serves resized copies (e.g. -300x300, -1024x1024) from the
      // same host, so only the hostname needs allowing.
      { protocol: "https", hostname: "secure.gravatar.com" },
    ],
    formats: ["image/avif", "image/webp"],
    // If your host enables hotlink protection and product images 403,
    // set NEXT_PUBLIC_UNOPTIMIZED_IMAGES=1 to bypass the optimizer.
    unoptimized: process.env.NEXT_PUBLIC_UNOPTIMIZED_IMAGES === "1",
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
