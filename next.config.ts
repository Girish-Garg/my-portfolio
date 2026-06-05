import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The chat reads content/system-instruction.txt at request time. Trace it so
  // Vercel bundles the file into the /api/chat serverless function.
  outputFileTracingIncludes: {
    "/api/chat": ["./content/system-instruction.txt"],
  },
};

export default nextConfig;
