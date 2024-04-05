/** @type {import('next').NextConfig} */

const url = new URL(process.env.NEXT_PUBLIC_URL);

const config = {
  productionBrowserSourceMaps: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    tsconfigPath: './tsconfig.next.json',
    ignoreBuildErrors: true,
  },
  transpilePackages: ['@azzapp/shared/', '@azzapp/data'],
  modularizeImports: {
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: url.protocol.replace(':', ''),
        hostname: url.hostname,
        port: url.port,
        pathname: '/api/cover/**',
      },
    ],
  },
};

module.exports = config;
