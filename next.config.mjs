/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
    reactStrictMode: true,
    
    // Webpack config para suportar Prisma no Edge
    webpack: (config, { isServer }) => {
      if (isServer) {
        config.externals.push('@prisma/client');
      }
      return config;
    },
  };
  
  export default nextConfig;