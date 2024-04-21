/** @type {import('next').NextConfig} */

const remotePatterns = [];

if (process.env.NEXT_PUBLIC_URL) {
  const url = new URL(process.env.NEXT_PUBLIC_URL);
  remotePatterns.push({
    protocol: url.protocol.replace(':', ''),
    hostname: url.hostname,
    port: url.port,
    pathname: '/api/cover/**',
  });
}

const config = {
  productionBrowserSourceMaps: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    tsconfigPath: './tsconfig.next.json',
    ignoreBuildErrors: true,
  },
  transpilePackages: ['@azzapp/shared', '@azzapp/data', '@azzapp/payment'],
  modularizeImports: {
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
  },
  images: {
    remotePatterns,
  },
};

module.exports = config;
