import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Spline 3D: iframe mode (https://my.spline.design/...) needs no config.
  // If you install @splinetool/react-spline for scene.splinecode and hit SSR issues,
  // add: transpilePackages: ['@splinetool/react-spline']
  // Kept commented to keep build green without the optional dep.
};

export default nextConfig;
