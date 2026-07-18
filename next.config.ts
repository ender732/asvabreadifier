import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a fully static site into `out/` so Capacitor can bundle it into the
  // native iOS app. Required for TestFlight since there is no Node.js server.
  output: "export",

  // Capacitor serves files from the local filesystem, where the default
  // Next.js image optimizer (which needs a server) is unavailable.
  images: {
    unoptimized: true,
  },

  // Emit `/quiz` as `/quiz/index.html` so file-based navigation resolves
  // correctly inside the native WebView.
  trailingSlash: true,
};

export default nextConfig;
