import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const assetPrefix = isGitHubPages ? '/yuen-long-urban-studio' : '';

const nextConfig: NextConfig = {
  output: isGitHubPages ? 'export' : undefined,
  assetPrefix,
};

export default nextConfig;
