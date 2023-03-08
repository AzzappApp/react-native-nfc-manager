/** @type {import('next').NextConfig} */
module.exports = {
  productionBrowserSourceMaps: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    tsconfigPath: './tsconfig.next.json',
    ignoreBuildErrors: true,
  },
  transpilePackages: ['@azzapp/shared/', '@azzapp/data'],
};
