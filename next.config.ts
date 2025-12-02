/** @type {import('next').NextConfig} */
const nextConfig = {
  // This feature is for development only. 
  // It hides the black bar warning about suppressHydrationWarning.
  devIndicators: {
    suppressDeprecationWarnings: true,
  },
  
  // You can add other global configurations here if needed later (like images, headers, etc.)
};

module.exports = nextConfig;