/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['firebase'],
  webpack: (config, { dev, isServer }) => {
    // Disable module concatenation (scope hoisting) in production client build
    // to prevent "Cannot access X before initialization" TDZ errors on iOS WebKit
    if (!dev && !isServer) {
      config.optimization.concatenateModules = false
    }
    return config
  },
}

module.exports = nextConfig
