/** @type {import('next').NextConfig} */
const nextConfig = {
  // L'app directory est maintenant stable dans Next.js 14, plus besoin de l'activer en experimental
}

const withPWA = require('next-pwa')(nextConfig, {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

module.exports = withPWA
