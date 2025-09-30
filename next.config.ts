/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["puppeteer-core", "chrome-aws-lambda"],
  },
};

export default nextConfig;
