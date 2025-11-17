/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  experimental: {
    serverComponentsExternalPackages: ['pg', 'pdf-parse'],
  },
}

module.exports = nextConfig

