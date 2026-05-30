/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({ canvas: 'commonjs canvas' });
    }

    return config;
  },
};

export default nextConfig;
