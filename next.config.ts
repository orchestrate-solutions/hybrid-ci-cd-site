/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enable static export for GitHub Pages
  trailingSlash: true, // Add trailing slashes to URLs for GitHub Pages
  images: {
    unoptimized: true, // Disable image optimization (not supported in static export)
  },
  reactStrictMode: true,
};

export default nextConfig;
