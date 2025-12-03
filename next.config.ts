/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  // THE FIX: Turn off Strict Mode to stop the Map from crashing
  reactStrictMode: false,

  // Keep your other settings
  devIndicators: {
    suppressDeprecationWarnings: true,
  },
};

module.exports = withPWA(nextConfig);