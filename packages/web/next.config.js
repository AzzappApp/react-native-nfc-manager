/** @type {import('next').NextConfig} */
module.exports = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    tsconfigPath: './tsconfig.next.json',
    ignoreBuildErrors: true,
  },
  images: {
    disableStaticImages: true,
  },
  experimental: {
    appDir: true,
  },
  transpilePackages: ['@azzapp/shared/', '@azzapp/data', '@azzapp/relay'],
};
