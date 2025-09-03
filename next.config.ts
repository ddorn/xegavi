import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const createConfig = (phase: string): NextConfig => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    output: "standalone",
    distDir: isDev ? ".next-dev" : ".next",
  };
};

export default createConfig;
